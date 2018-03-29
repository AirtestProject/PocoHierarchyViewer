
import React from 'react'
import autoBind from 'react-autobind'
import rp from 'request-promise'

import {Icon} from '../../util/icon'

import {InspectorViewBase} from '../hierarchyViewer'

const PocoServicePackage = 'com.netease.open.pocoservice'
const PocoServicePackageTest = 'com.netease.open.pocoservice.test'
const PocoServiceApk = 'pocoservice-debug.apk'
const PocoServiceApkTest = 'pocoservice-debug-androidTest.apk'

const AppResourcePath = window.process.execPath.indexOf('build--') >= 0 ? `${window.process.resourcesPath}/app` : window.process.cwd()  // 区分一下打包环境和源码开发环境
const PocoServiceApkPath = `${AppResourcePath}/lib/apk/${PocoServiceApk}`
const PocoServiceApkTestPath = `${AppResourcePath}/lib/apk/${PocoServiceApkTest}`


const Promise = window.require('bluebird')
const path = window.require('path')
const ApkReader = window.require('node-apk-parser')
const adb = window.require('adbkit')

const adbClient = adb.createClient()

var checkInstalled = (sn, apkfile, packageName) => {
    if (!path.isAbsolute(apkfile)) {
        apkfile = path.join(window.__dirname, apkfile)
    }
    let manifest = ApkReader.readFile(apkfile).readManifestSync()
    return adbClient.shell(sn, `dumpsys package ${packageName}`)
        .then(adb.util.readAll)
        .then(output => {
            let versionCode = output.toString().match(/versionCode=(\d+)/)
            if (versionCode) {
                return parseInt(versionCode[1]) >= (manifest.versionCode || 0)
            }
            return false
        })
}

var ensureInstalled = (sn, apkfile, packageName) => {
    return new Promise(resolve => {
        checkInstalled(sn, apkfile, packageName)
            .then(installed => {
                if (installed) {
                    resolve()
                } else {
                    setTimeout(() => {
                        resolve(ensureInstalled(sn, apkfile, packageName))
                    }, 500)
                }
            })
    })
}

export class AndroidInspectorView extends InspectorViewBase {
    constructor(props) {
        super(props)
        autoBind(this)

        this._refreshTimer = null
        this._restartInstrumentTimer = null
        const sn = this.props.sn
        
        let testApkShouldReinstall = false
        adbClient.shell(sn, `am force-stop ${PocoServicePackage}`)
            // 安装，如果主apk重装了，那么test apk也要重装
            .then(() => checkInstalled(sn, PocoServiceApkPath, PocoServicePackage))            
            .then(installed => {
                if (!installed) {
                    console.log('poco service not installed.')
                    testApkShouldReinstall = true
                    return Promise.resolve()
                        .then(() => adbClient.push(sn, PocoServiceApkPath, `/data/local/tmp/${PocoServiceApk}`))
                        .delay(1000)
                        .then(() => adbClient.shell(sn, `pm install "/data/local/tmp/${PocoServiceApk}"`))
                        .then(() => ensureInstalled(sn, PocoServiceApkPath, PocoServicePackage))
                        .then(() => checkInstalled(sn, PocoServiceApkPath, PocoServicePackage))
                        .then(installed => {
                            console.log('poco service installed?', installed)
                        })
                }
            })
            .then(() => checkInstalled(sn, PocoServiceApkTestPath, PocoServicePackageTest))
            .then(installed => {
                if (!installed || testApkShouldReinstall) {
                    return Promise.resolve()
                        .then(() => adbClient.push(sn, PocoServiceApkTestPath, `/data/local/tmp/${PocoServiceApkTest}`))
                        .delay(500)
                        .then(() => adbClient.shell(sn, `pm install -r "/data/local/tmp/${PocoServiceApkTest}"`))
                        .then(() => ensureInstalled(sn, PocoServiceApkTestPath, PocoServicePackageTest))
                }
            })

            // 启动
            .then(() => {
                console.log('install success')
                return new Promise(resolve => {
                    let startInstrument = () => {
                        return Promise.resolve()
                            .then(() => adbClient.shell(sn, `am force-stop ${PocoServicePackage}`))
                            .then(() => adbClient.shell(sn, `am instrument -w -e class ${PocoServicePackage}.InstrumentedTestAsLauncher#launch ${PocoServicePackage}.test/android.support.test.runner.AndroidJUnitRunner`))
                            .then(adb.util.readAll)
                            .then(output => {
                                console.log(output.toString())
                                this._restartInstrumentTimer = setTimeout(startInstrument, 1500)  // instrument 启动失败的话，就重新启动
                            })
                    }
                    setTimeout(() => {
                        startInstrument()
                        console.log('poco service is starting')
                        setTimeout(() => {
                            // 还要延迟一下子这个service才启动起来
                            resolve()
                        }, 500)
                    }, 500)
                })
            })

            // forward
            .then(() => {
                console.log('poco service forward to tcp:10080')
                return adbClient.forward(sn, 'tcp:10080', 'tcp:10080')
            })
            .then(() => {
                console.log('poco service started')
                this.serviceStarted = true
            })
    }

    refresh(width) {
        let hierarchyReq = rp({
            uri: 'http://127.0.0.1:10080/hierarchy',
            json: true,
        })
        let screenSizeReq = rp({
            uri: 'http://127.0.0.1:10080/screen_size',
            json: true,
        })
        let screenReq = rp({
            uri: 'http://127.0.0.1:10080/screen',
            qs: {width},
            json: true,
        })
        return Promise.all([hierarchyReq, screenSizeReq, screenReq])
            .then(resp => {
                let [hierarchy, screenSize, screen] = resp
                this.setState({hierarchyTree: hierarchy, screen: `data:image/jpeg;base64,${screen}`, screenWidth: screenSize[0], screenHeight: screenSize[1]})
            })
    }
    onDisconnect() {
        clearTimeout(this._restartInstrumentTimer)
        clearTimeout(this._refreshTimer)
    }
    renderCustomizedToolbar() {
        return <span style={{marginLeft: '15px'}}>
            <Icon icon='phone_android' size={16} />
            <small>{`${this.props.device.model} (${this.props.sn})`}</small>
        </span>
    }
}

import React from 'react'
import ReactDOM from 'react-dom'
import {HashRouter as Router, Route} from 'react-router'
import autoBind from 'react-autobind'

import rp from 'request-promise'
import $ from 'jquery'
import _ from 'lodash'
import EventEmitter from 'eventemitter3'

import IconButton from '../util/IconButton'
import {Icon} from '../util/icon'
import {SPAContainer} from '../base/spa'
import {InspectorPanel} from '../base/inspector-panel'


const path = window.require('path')
const ApkReader = window.require('node-apk-parser')
const adb = window.require('adbkit')
const adbClient = adb.createClient()
const eventEmitter = new EventEmitter()

const PocoServicePackage = 'com.netease.open.pocoservice'
const PocoServicePackageTest = 'com.netease.open.pocoservice.test'
const PocoServiceApk = 'pocoservice-debug.apk'
const PocoServiceApkTest = 'pocoservice-debug-androidTest.apk'

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

class InspectorView extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            hierarchyTree: null,
            screen: '',
            screenWidth: 1920,
            screenHeight: 1080,
        }
        autoBind(this)

        this.serviceStarted = false
        const sn = this.props.sn
        
        let testApkShouldReinstall = false
        adbClient.shell(sn, `am force-stop ${PocoServicePackage}`)
            // 安装，如果主apk重装了，那么test apk也要重装
            .then(() => checkInstalled(sn, `lib/apk/${PocoServiceApk}`, PocoServicePackage))            
            .then(installed => {
                if (!installed) {
                    testApkShouldReinstall = true
                    return Promise.resolve()
                        .then(() => adbClient.push(sn, `lib/apk/${PocoServiceApk}`, `/data/local/tmp/${PocoServiceApk}`))
                        .then(() => adbClient.shell(sn, `pm install "/data/local/tmp/${PocoServiceApk}"`))
                }
            })
            .then(() => checkInstalled(sn, `lib/apk/${PocoServiceApkTest}`, PocoServicePackageTest))
            .then(installed => {
                if (!installed || testApkShouldReinstall) {
                    return Promise.resolve()
                        .then(() => adbClient.push(sn, `lib/apk/${PocoServiceApkTest}`, `/data/local/tmp/${PocoServiceApkTest}`))
                        .then(() => adbClient.shell(sn, `pm install -r "/data/local/tmp/${PocoServiceApkTest}"`))
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
                                setTimeout(startInstrument, 1000)  // instrument 启动失败的话，就重新启动
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
            qs: {width: width},
            json: true,
        })
        return Promise.all([hierarchyReq, screenSizeReq, screenReq])
            .then(resp => {
                let [hierarchy, screenSize, screen] = resp
                this.setState({hierarchyTree: hierarchy, screen: `data:image/jpeg;base64,${screen}`, screenWidth: screenSize[0], screenHeight: screenSize[1]})
            })
    }
    handleBackToDeviceSelect() {
        eventEmitter.emit('back-to-device-selection')
    }
    componentDidMount() {
        let tryToRefresh = () => {
            if (!this.serviceStarted) {
                setTimeout(() => {
                    tryToRefresh()
                }, 100)
                return
            }
            this.refresh(1920)
                .catch(err => {
                    console.log('service is still starting, try again later.', err)
                    setTimeout(tryToRefresh, 500)
                })
        }
        tryToRefresh()
    }
    render() {
        const toolBarButton = (icon, hint, onClick, btnClass='-') => {
            return <IconButton onClick={onClick} btnClass={btnClass} iconStyle={{fontSize: '20px'}} btnStyle={{marginRight: '4px'}} icon={icon} hint={hint} hintPlacement='bottom' />
        }
        let customToolbar = <span style={{marginRight: '20px'}}>
            {toolBarButton('keyboard_backspace', '返回', this.handleBackToDeviceSelect)}
            <span style={{marginLeft: '15px'}}>
                <Icon icon='phone_android' size={16} />
                <small>{`${this.props.device.model} (${this.props.sn})`}</small>
            </span>
        </span>

        return <InspectorPanel 
            hierarchyTree={this.state.hierarchyTree} 
            screen={this.state.screen} 
            screenWidth={this.state.screenWidth} 
            screenHeight={this.state.screenHeight} 
            onRefreshRequest={this.refresh}
            customToolbar={customToolbar} />
    }
}


class DeviceSelection extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            devices: {},  // id -> {id: '', type: '', model: ''}
            selectedDeviceSerial: null,
        }
        autoBind(this)
    }

    handleSelectDevice(sn) {
        return () => {
            this.setState({selectedDeviceSerial: sn})
        }
    }

    startDeviceTracking() {
        adbClient.trackDevices()
            .then(tracker => {
                tracker.on('add', device => {
                    adbClient.getProperties(device.id)
                        .then(properties => {
                            let model = properties['ro.product.model']
                            let manufacture = properties['ro.product.manufacturer']
                            return model || manufacturer
                        })
                        .then(model => {
                            let {devices} = this.state
                            let deviceinfo = devices[device.id]
                            deviceinfo.model = model
                            devices[device.id] = deviceinfo
                            this.setState({devices})
                        })
                })
                tracker.on('remove', device => {
                    let {devices} = this.state
                    delete devices[device.id]
                    this.setState({devices})
                })
                tracker.on('end', () => {
                    setTimeout(this.startDeviceTracking, 1000)
                })
            })
            .catch(err => {
                console.error('Something went wrong:', err.stack)
            })
    }
    handleBackToThisPage() {
        this.setState({selectedDeviceSerial: null})
    }
    componentDidMount() {
        setTimeout(this.startDeviceTracking, 1000)
        adbClient.listDevices()
            .then(devs => {
                Promise.all(_.map(devs, dev => {
                    return adbClient.getProperties(dev.id)
                        .then(properties => {
                            let model = properties['ro.product.model']
                            let manufacture = properties['ro.product.manufacturer']
                            return [dev, model || manufacturer]
                        })
                }))
                .then(devModels => {
                    let devices = {}
                    for (let devmodel of devModels) {
                        let [dev, model] = devmodel
                        devices[dev.id] = Object.assign({model}, dev)
                    }
                    return devices
                })
                .then(devices => {
                    this.setState({devices})
                })
            })

        eventEmitter.on('back-to-device-selection', this.handleBackToThisPage)
    }
    componentWillUnmount() {
        eventEmitter.removeListener('back-to-device-selection', this.handleBackToThisPage)
    }


    render() {
        let devlist = _.map(this.state.devices, dev => {
            return <IconButton key={dev.id} text={`${dev.model}  [${dev.id}]  (${dev.type})`} onClick={this.handleSelectDevice(dev.id)} />
        })
        return <div>
            {this.state.selectedDeviceSerial && <InspectorView sn={this.state.selectedDeviceSerial} device={this.state.devices[this.state.selectedDeviceSerial]}/>}
            {!this.state.selectedDeviceSerial && <div style={{padding: '15px'}}>
                <h3>Poco Hierarchy Viewer</h3>
                {Object.keys(this.state.devices).length === 0 && <div style={{marginTop: '20px', marginBottom: '10px'}} className='text-secondary'>No devices present</div>}
                {Object.keys(this.state.devices).length !== 0 && <div>
                    <div style={{marginTop: '20px', marginBottom: '10px'}} className='text-secondary'>Select device</div>
                    <div>
                        {devlist}
                    </div>
                </div>}
                <div style={{position: 'absolute', left: '15px', bottom: '15px'}}>
                    <IconButton icon='refresh' hint='refresh' onClick={() => window.location.reload()} />
                </div>
            </div>}
        </div>
    }
}


$(document).ready(function () {
    ReactDOM.render(
        <DeviceSelection />,
        $('#main').get(0)
    )
})


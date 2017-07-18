
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


const adb = window.require('adbkit')
const adbClient = adb.createClient()
const eventEmitter = new EventEmitter()

const PocoServicePackage = 'com.netease.open.pocoservice'
const PocoServiceApk = 'pocoservice-debug.apk'
const PocoServiceApkTest = 'pocoservice-debug-androidTest.apk'


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
        
        adbClient.shell(sn, `am force-stop ${PocoServicePackage}`)
        adbClient.isInstalled(sn, PocoServicePackage)  // 改用versionCode判断
            // 安装
            .then(installed => {
                if (!installed) {
                    return Promise.resolve()
                        .then(() => adbClient.push(sn, `lib/apk/${PocoServiceApk}`, `/data/local/tmp/${PocoServiceApk}`))
                        .then(() => adbClient.shell(sn, `pm install "/data/local/tmp/${PocoServiceApk}"`))
                }
            })
            .then(() => {
                console.log('service installed')
                return Promise.resolve()
                    .then(() => adbClient.push(sn, `lib/apk/${PocoServiceApkTest}`, `/data/local/tmp/${PocoServiceApkTest}`))
                    .then(() => adbClient.shell(sn, `pm install -r "/data/local/tmp/${PocoServiceApkTest}"`))
            })
            .then(() => {
                console.log('install success')

                // 启动
                return new Promise(resolve => {
                    setTimeout(() => {
                        adbClient.shell(sn, `am instrument -w -e class ${PocoServicePackage}.InstrumentedTestAsLauncher#launch ${PocoServicePackage}.test/android.support.test.runner.AndroidJUnitRunner`)
                            .then(adb.util.readAll)
                            .then(output => {
                                console.log(output.toString())
                            })
                        console.log('poco service is starting')
                        setTimeout(() => {
                            // 还要延迟一下子这个service才启动起来
                            resolve()
                        }, 500)
                    }, 500)
                })
                
                
            })
            .then(() => {
                // forward
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
                <small>{`${this.props.device.manufacture} (${this.props.sn})`}</small>
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
            devices: {},  // id -> {id: '', type: ''}
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
                    let {devices} = this.state
                    devices[device.id] = device
                    this.setState({devices})
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
        this.startDeviceTracking()
        adbClient.listDevices()
            .then(devs => {
                let devices = {}
                for (let dev of devs) {
                    devices[dev.id] = dev
                }
                this.setState({devices})
            })

        eventEmitter.on('back-to-device-selection', this.handleBackToThisPage)
    }
    componentWillUnmount() {
        eventEmitter.removeListener('back-to-device-selection', this.handleBackToThisPage)
    }


    render() {
        let devlist = _.map(this.state.devices, dev => {
            return <IconButton key={dev.id} text={`${dev.id} (${dev.type})`} onClick={this.handleSelectDevice(dev.id)} />
        })
        return <div>
            {this.state.selectedDeviceSerial && <InspectorView sn={this.state.selectedDeviceSerial} device={{manufacture: 'SONY'}}/>}
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


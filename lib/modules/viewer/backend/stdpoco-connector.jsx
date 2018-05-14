
import React from 'react'
import autoBind from 'react-autobind'
import _ from 'lodash'
import linkState from 'react-link-state'
import {Tabs, Tab} from 'react-bootstrap'

import IconButton from '../../util/IconButton'
import {TinyLabeledInput, Checkbox} from '../../util/Form'

import {Unity3dInspectorView} from './stdpoco'
import {AdbDevices} from '../utils/adb-devices'

const adb = window.require('adbkit')


class DevicesTracker extends AdbDevices {
    constructor(client, connector) {
        super(client)
        this.connector = connector
    }
    onDevicesChanged(devices) {
        this.connector.setState({devices})
        if (Object.keys(devices).length > 0 && !this.connector.state.selectedDeviceSerialNo) {
            let sn = Object.keys(devices)[0]
            this.connector.setState({selectedDeviceSerialNo: sn})
        }
    }
}


const PLATFORM_REMOTE = 1
const PLATFORM_ANDROID = 2


export class StdPocoDeviceConnector extends React.Component {
    constructor(props) {
        super(props)
        let initialState = JSON.parse(localStorage.getItem('StdPocoDeviceConnector.default.initialState') || "{}")
        console.log()
        this.state = {
            ip: initialState.ip || 'localhost',
            port: initialState.port || '5001',
            useAdbForward: initialState.useAdbForward || false,
            platformSelectionKey: initialState.platformSelectionKey || 1,

            // adb forward 模式下才有用
            devices: {},
            selectedDeviceSerialNo: null,
        }
        autoBind(this)

        this.adbClient = adb.createClient()
        this.deviceTracker = null
    }

    handleConnectDevice() {
        let {ip, port} = this.state
        let iport = parseInt(port)
        if (isNaN(iport) || port < 1024 || port > 65535) {
            alert(`Port should be in range of 1024~65535, got ${port}`)
            return
        }

        let platform = ''
        let options = {}
        if (this.state.platformSelectionKey === PLATFORM_ANDROID) {
            platform = 'android'
            if (this.state.useAdbForward) {
                ip = 'localhost'
                this.adbClient.forward(this.state.selectedDeviceSerialNo, `tcp:${port}`, `tcp:${port}`)
                    .then(() => {
                        this.props.onConnectDevice(view)
                    })
            }
        } else {
            platform = 'any'
        }

        localStorage.setItem('StdPocoDeviceConnector.default.initialState', JSON.stringify(this.state))

        let view = <Unity3dInspectorView ip={ip} port={iport} platform={platform} options={options} />
        this.props.onConnectDevice(view)
    }

    prepareDeviceTracker() {
        if (!this.deviceTracker && this.state.useAdbForward) {
            this.deviceTracker = new DevicesTracker(this.adbClient, this)
        } else if (this.deviceTracker && !this.state.useAdbForward) {
            this.setState({devices: {}})
            this.deviceTracker = null
        }
    }
    handleSelectPlatform(key) {
        this.setState({platformSelectionKey: key})
    }

    componentDidUpdate() {
        this.prepareDeviceTracker()
    }
    componentDidMount() {
        this.prepareDeviceTracker()
    }

    render() {
        let devlist = null
        if (this.state.useAdbForward) {
            devlist = _.map(this.state.devices, dev => {
                let devInfo = this.state.devices[dev.id]
                let selected = this.state.selectedDeviceSerialNo === dev.id
                let btnClass = selected ? 'btn btn-xs btn-primary' : ''
                return <div key={dev.id}>
                    <IconButton btnClass={btnClass} text={`${dev.model}  [${dev.id}]  (${dev.type})`} onClick={() => this.setState({selectedDeviceSerialNo: dev.id})} />
                    <span style={{marginLeft: '10px'}}>{selected ? 'selected' : ''}</span>
                </div>
            })
        }

        let connectDisabled = false
        if (this.state.useAdbForward && (this.state.devices.length === 0 || !this.state.selectedDeviceSerialNo)) {
            connectDisabled = true
        }

        let ipIsLocalhost = this.state.useAdbForward && this.state.platformSelectionKey === PLATFORM_ANDROID

        return <div style={{marginTop: '10px'}}>
            <div style={{width: '50%'}}>
                <div className='text-secondary' style={{fontSize: '12px'}}>
                    Please input the ip address of your phone, not the PC/mac.
                </div>
                {!ipIsLocalhost && 
                    <div style={{marginBottom: '15px'}}><TinyLabeledInput required valueLink={linkState(this, 'ip')} label='IP' /></div>
                }
                {ipIsLocalhost &&
                    <div style={{marginBottom: '15px'}}><TinyLabeledInput readOnly value='localhost' label='IP' /></div>
                }

                <div className='text-secondary' style={{fontSize: '12px'}}>
                    This port is the poco-sdk in your game/app listens on, not the port of adb server. For StdPoco, the default port is 15004. For Unity3D, is 5001.
                </div>
                <div style={{marginBottom: '15px'}}><TinyLabeledInput required valueLink={linkState(this, 'port')} label='Port' /></div>
                
                <div style={{height: '10px'}}></div>
                <Tabs activeKey={this.state.platformSelectionKey} onSelect={this.handleSelectPlatform} id="platform-selection-tab">
                    <Tab eventKey={1} title='Remote' style={{padding: '5px'}}>
                        <div className='text-secondary'>Connect to device directly through network. Including Android, Windows, iOS, UnityEditor. Please ensure your phone and this PC/mac locates in the same subnet.</div>
                    </Tab>
                    <Tab eventKey={2} title="Android" style={{padding: '5px'}}>
                        <div><Checkbox checkedLink={linkState(this, 'useAdbForward')} label='Use adb forward' /></div>
                        {this.state.useAdbForward && <div style={{paddingLeft: '20px'}}>
                            {devlist.length > 0 && <div>
                                <div style={{marginTop: '10px', color: '#aaaaaa'}}>Select one of the following devices to forward port.</div>
                                <div>{devlist}</div>
                            </div>}
                            {devlist.length === 0 && <div style={{marginTop: '10px', color: 'orangered'}}>Error: No device available. Connect at lease one Android device to this PC/mac or input the IP address of your mobile device. Or use REMOTE mode to connect directly.</div>}
                        </div>}
                    </Tab>
                </Tabs>

                

                <div style={{marginTop: '15px'}}><IconButton disabled={connectDisabled} btnClass='btn btn-sm btn-success' text='Connect' onClick={this.handleConnectDevice} /></div>
            </div>
        </div>
    }
}


import React from 'react'
import autoBind from 'react-autobind'
import _ from 'lodash'
import linkState from 'react-link-state'

import IconButton from '../../util/IconButton'
import {TinyLabeledInput, Checkbox} from '../../util/Form'

import {Unity3dInspectorView} from './unity3d'
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


export class Unity3dDeviceConnector extends React.Component {
    constructor(props) {
        super(props)
        let initialState = JSON.parse(localStorage.getItem('Unity3dDeviceConnector.default.initialState') || "{}")
        console.log()
        this.state = {
            ip: initialState.ip || 'localhost',
            port: initialState.port || '5001',
            useAdbForward: initialState.useAdbForward || false,

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

        if (this.state.useAdbForward) {
            ip = 'localhost'
        }

        let view = <Unity3dInspectorView ip={ip} port={iport} />

        if (this.state.useAdbForward) {
            this.adbClient.forward(this.state.selectedDeviceSerialNo, `tcp:${port}`, `tcp:${port}`)
                .then(() => {
                    this.props.onConnectDevice(view)
                })
        } else {
            this.props.onConnectDevice(view)
        }

        localStorage.setItem('Unity3dDeviceConnector.default.initialState', JSON.stringify(this.state))
    }

    prepareDeviceTracker() {
        if (!this.deviceTracker && this.state.useAdbForward) {
            this.deviceTracker = new DevicesTracker(this.adbClient, this)
        } else if (this.deviceTracker && !this.state.useAdbForward) {
            this.setState({devices: {}})
            this.deviceTracker = null
        }
    }

    componentDidUpdate() {
        this.prepareDeviceTracker()
    }
    componentDidMount() {
        this.prepareDeviceTracker()
    }

    render() {
        let devlist = _.map(this.state.devices, dev => {
            let devInfo = this.state.devices[dev.id]
            let selected = this.state.selectedDeviceSerialNo === dev.id
            let btnClass = selected ? 'btn btn-xs btn-primary' : ''
            return <div key={dev.id}>
                <IconButton btnClass={btnClass} text={`${dev.model}  [${dev.id}]  (${dev.type})`} onClick={() => this.setState({selectedDeviceSerialNo: dev.id})} />
                <span style={{marginLeft: '10px'}}>{selected ? 'selected' : ''}</span>
            </div>
        })

        let connectDisabled = false
        if (this.state.useAdbForward && (this.state.devices.length === 0 || !this.state.selectedDeviceSerialNo)) {
            connectDisabled = true
        }

        return <div style={{marginTop: '10px'}}>
            <div style={{width: '50%'}}>
                {!this.state.useAdbForward && 
                    <div><TinyLabeledInput required valueLink={linkState(this, 'ip')} label='IP' /></div>
                }
                {this.state.useAdbForward &&
                    <div><TinyLabeledInput readOnly value='localhost' label='IP' /></div>
                }
                <div><TinyLabeledInput required valueLink={linkState(this, 'port')} label='Port' /></div>
                <div><Checkbox checkedLink={linkState(this, 'useAdbForward')} label='Use adb forward' /></div>

                {this.state.useAdbForward && <span>
                    {devlist.length > 0 && <div>
                        <div style={{marginTop: '10px', color: '#aaaaaa'}}>Select one of the following devices to forward port.</div>
                        <div>{devlist}</div>
                    </div>}
                    {devlist.length === 0 && <div style={{marginTop: '10px', color: 'orangered'}}>Error: No device available. Connect at lease one Android device to this PC/mac or input the IP address of your mobile device.</div>}
                </span>}

                <div style={{marginTop: '15px'}}><IconButton disabled={connectDisabled} btnClass='btn btn-sm btn-success' text='Connect' onClick={this.handleConnectDevice} /></div>
            </div>
        </div>
    }
}


import React from 'react'
import autoBind from 'react-autobind'
import _ from 'lodash'

import IconButton from '../../util/IconButton'
import {AndroidInspectorView} from './android'
import {AdbDevices} from '../utils/adb-devices'

const adb = window.require('adbkit')

class DevicesTracker extends AdbDevices {
    constructor(client, connector) {
        super(client)
        this.connector = connector
    }
    onDevicesChanged(devices) {
        this.connector.setState({devices})
    }
}

export class AndroidDeviceConnector extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            devices: {},  // id -> {id: '', type: '', model: ''}
        }
        autoBind(this)

        this.adbClient = adb.createClient()
        this.devicesTracker = null
    }

    handleConnectDevice(udid, info) {
        return () => {
            let view = <AndroidInspectorView sn={udid} device={info} />
            this.props.onConnectDevice(view)
        }
    }

    componentDidMount() {
        this.devicesTracker = new DevicesTracker(this.adbClient, this)
    }

    render() {
        let devlist = _.map(this.state.devices, dev => {
            let devInfo = this.state.devices[dev.id]
            return <div key={dev.id}><IconButton text={`${dev.model}  [${dev.id}]  (${dev.type})`} onClick={this.handleConnectDevice(dev.id, devInfo)} /></div>
        })
        return <div>            
            {Object.keys(this.state.devices).length === 0 && <div style={{marginTop: '20px', marginBottom: '10px'}} className='text-secondary'>No devices present</div>}
            {Object.keys(this.state.devices).length !== 0 && <div>
                <div style={{marginTop: '20px', marginBottom: '10px'}} className='text-secondary'>Select device</div>
                <div>
                    {devlist}
                </div>
            </div>}
        </div>
    }
}

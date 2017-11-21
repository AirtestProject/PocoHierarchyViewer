
import React from 'react'
import autoBind from 'react-autobind'
import _ from 'lodash'

import IconButton from '../../util/IconButton'
import {AndroidInspectorView} from './android'

const adb = window.require('adbkit')

const adbClient = adb.createClient()

export class AndroidDeviceConnector extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            devices: {},  // id -> {id: '', type: '', model: ''}
        }
        autoBind(this)
    }

    handleConnectDevice(udid, info) {
        return () => {
            let view = <AndroidInspectorView sn={udid} device={info} />
            this.props.onConnectDevice(view)
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
            <div style={{position: 'absolute', left: '15px', bottom: '15px'}}>
                <IconButton icon='refresh' hint='refresh' onClick={() => window.location.reload()} />
            </div>
        </div>
    }
}

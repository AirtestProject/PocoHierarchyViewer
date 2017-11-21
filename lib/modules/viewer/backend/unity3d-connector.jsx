
import React from 'react'
import autoBind from 'react-autobind'
import _ from 'lodash'
import linkState from 'react-link-state'

import IconButton from '../../util/IconButton'
import {TinyLabeledInput, Checkbox} from '../../util/Form'

import {Unity3dInspectorView} from './unity3d'


export class Unity3dDeviceConnector extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            ip: 'localhost',
            port: '5001',
            useAdbForward: false,
        }
        autoBind(this)
    }

    handleConnectDevice() {
        let {ip, port} = this.state
        let iport = parseInt(port)
        if (isNaN(iport) || port < 1024 || port > 65535) {
            alert(`Port should be in range of 1024~65535, got ${port}`)
            return
        }

        if (this.state.useAdbForward) {
            alert('Cannot use adb forward now. Not implemented yet.')
            return
        }

        let view = <Unity3dInspectorView ip={ip} port={iport} />
        this.props.onConnectDevice(view)
    }

    render() {
        return <div style={{marginTop: '10px'}}>
            <div style={{width: '50%'}}>       
                <div><TinyLabeledInput required valueLink={linkState(this, 'ip')} label='IP' /></div>
                <div><TinyLabeledInput required valueLink={linkState(this, 'port')} label='Port' /></div>
                <div><Checkbox checkedLink={linkState(this, 'useAdbForward')} label='Use adb forward' /></div>

                <div style={{marginTop: '10px'}}><IconButton btnClass='btn btn-sm btn-success' text='Connect' onClick={this.handleConnectDevice} /></div>
            </div>
        </div>
    }
}


import React from 'react'
import ReactDOM from 'react-dom'
import autoBind from 'react-autobind'
import linkState from 'react-link-state'
import rp from 'request-promise'
import $ from 'jquery'
import _ from 'lodash'

import {DropdownSelectionFixed} from '../util/DropdownSelection'

import {globalEventEmitter} from './event'
import {AndroidDeviceConnector} from './backend/android-connector'
import {AndroidInspectorView} from './backend/android'
import {MODE_ANDROID_APP, MODE_UNITY} from './connector-modes'


class MainConnector extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            connectorMode: MODE_ANDROID_APP,
            hierarchyView: null,
        }
        autoBind(this)
    }

    componentDidMount() {
        globalEventEmitter.on('disconnect-device', this.disconnectDevice)
    }
    componentWillUnmount() {
        globalEventEmitter.removeListener('disconnect-device', this.disconnectDevice)
    }

    connectDevice(mode, udid, info) {
        let view = null
        if (mode === MODE_ANDROID_APP) {
            view = <AndroidInspectorView sn={udid} device={info} />
        }

        this.setState({hierarchyView: view})
    }
    disconnectDevice() {
        this.setState({hierarchyView: null})
    }

    render() {
        return <div>
            {!this.state.hierarchyView && <div>
                <div style={{backgroundColor: '#222', padding: '5px 15px'}}>
                    <h3>Poco Hierarchy Viewer</h3>
                    <div>
                        <span>mode: </span>
                        <DropdownSelectionFixed selections={[MODE_ANDROID_APP, MODE_UNITY]} valueLink={linkState(this, 'connectorMode')} />
                    </div>
                </div>

                <div style={{marginLeft: '15px'}}>
                    {this.state.connectorMode === MODE_ANDROID_APP && <AndroidDeviceConnector onConnectDevice={this.connectDevice} />}
                </div>
            </div>}

            {this.state.hierarchyView}
        </div>
    }
}


$(document).ready(function () {
    ReactDOM.render(
        <MainConnector />,
        $('#main').get(0)
    )
})


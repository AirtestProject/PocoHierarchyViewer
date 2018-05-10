
import React from 'react'
import autoBind from 'react-autobind'
import toastr from 'toastr'

import {Icon} from '../../util/icon'

import {InspectorViewBase} from '../hierarchyViewer'

const RpcClient =  require('../../jsrpc/rpcclient')
const clientSocket = require('../../jsrpc/transport')
const Screen = require('../../poco-driver/std/screen')
const Dumper = require('../../poco-driver/std/dumper')
const StdPocoAgent = require('../../poco-driver/std')

const Promise = window.require('bluebird')


export class Unity3dInspectorView extends InspectorViewBase {
    constructor(props) {
        super(props)
        this.state['profileData'] = {
            dump: 0,
            dumpSerialize: 0,
            screenshot: 0,
        }
        this.state.sdkVersionCode = 'unknown'
        autoBind(this)

        let client_s = new clientSocket.ClientSocket()
        let client = new RpcClient(client_s)
        this.connection = client.connect(this.props.ip, this.props.port).then(() => {
            this.screen = new Screen(client)
            this.dumper = new Dumper(client)
            this.pocoAgent = new StdPocoAgent(client)
            this.refresh()
            this.getSDKVersion()
        })
    }

    refreshScreen(width) {
        return this.screen.getScreen(width).then(res => {
            let [b64img, fmt] = res
            let screenData = `data:image/${fmt};base64,${b64img}`
            this.setState({screen: screenData})
        })
    }

    refreshDumper() {
        return this.dumper.dumpHierarchy().then(jsonHierarchy => {
            this.setState({hierarchyTree: jsonHierarchy})
        })
    }

    getSDKVersion() {
        this.pocoAgent.getSdkVersion().then(sdkVersion => {
            this.setState({sdkVersionCode: sdkVersion})
        })
    }

    refresh(width) {
        this.refreshDumper().then(() => {
            return this.pocoAgent.getDebugProfiling_data().then(res => {
                this.setState({
                    profileData: {
                        dump: res.dump,
                        dumpSerialize: res.handleRpcRequest - res.dump,
                        screenshot: 0
                    }
                })
            })
        }).then(() => {
            return this.refreshScreen(width)
        }).then(() => {
            return this.pocoAgent.getDebugProfiling_data().then(res => {
                this.setState({
                    profileData: {
                        dump: this.state.profileData['dump'],
                        dumpSerialize: this.state.profileData['dumpSerialize'],
                        screenshot: res.screenshot
                    }
                })
            })
        })
    }

    onDisconnect() {
    }

    renderCustomizedToolbar() {
        return <span style={{marginLeft: '15px'}}>
            <Icon icon='gamepad' size={16} />
            <small>{`${this.props.ip}:${this.props.port}`}</small>
            <small style={{color: 'grey', marginLeft: '10px'}}>{`
                [dump: ${this.state.profileData.dump}ms]  
                [dumpSerialize: ${this.state.profileData.dumpSerialize}ms]  
                [screenshot: ${this.state.profileData.screenshot}ms]  
                [sdk-version: ${this.state.sdkVersionCode}]`} 
            </small>
        </span>
    }
}
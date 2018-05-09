
import React from 'react'
import autoBind from 'react-autobind'
import rp from 'request-promise'
import toastr from 'toastr'

import {Icon} from '../../util/icon'

import {InspectorViewBase} from '../hierarchyViewer'

const RpcClient =  require('../../jsrpc/rpcclient')
const clientSocket = require('../../jsrpc/transport')
const Screen = require('../../poco-driver/std/screen')
const Dumper = require('../../poco-driver/std/dumper')

const Promise = window.require('bluebird')
const {spawn} = window.require('child_process')

const HierarchyBoundary = '-----H1eRarCHy-B0UNDARY-!@#$%^&&*+----'
const HierarchyBoundaryEnd = '-----H1eRarCHy-B0UNDARY-!@#$%^&&*+----1Nd---end---'
const ScreenBoundary = '-----sCr11n-B0UNdARY-!@#$%^&&*+----'
const ScreenBoundaryEnd = '-----sCr11n-B0UNdARY-!@#$%^&&*+----1Nd---end---'
const ProfileDataBoundary = '-----pr0F1Le-B0UNdARY-!@#$%^&&*+----'
const ProfileDataBoundaryEnd = '-----pr0F1Le-B0UNdARY-!@#$%^&&*+----1Nd---end---'
const SDKVersionBoundary = '-----sdkVERs1on-B0UNdARY-!@#$%^&&*+----'
const SDKVersionBoundaryEnd = '-----sdkVERs1on-B0UNdARY-!@#$%^&&*+----1Nd---end---'

const AppResourcePath = window.process.execPath.indexOf('build--') >= 0 ? `${window.process.resourcesPath}/app` : window.process.cwd()  // 区分一下打包环境和源码开发环境


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
            this.refresh()
            // this.getSDKVersion()
        })
    }

    refreshScreen(width) {
        this.screen.getScreen(width).then(res => {
            var screenData = "data:image/" + res[1] + ";base64," + res[0]
            this.setState({screen: screenData})
        })
    }

    refreshDumper() {
        this.dumper.dumpHierarchy().then(jsonHierarchy => {
            this.setState({hierarchyTree: jsonHierarchy})
        })
    }

    refresh(width) {
        this.refreshScreen(width)
        this.refreshDumper()
    }

    getSDKVersion() {
        let isUnityEditor = this.props.platform === 'windows' && this.props.options.isUnityEditor
        let code = `
def get_sdk_version():
    # cache poco instance globally to speed up
    poco = globals().get('poco')
    if poco is None:
        poco = UnityPoco(("${this.props.ip}", ${this.props.port}), ${isUnityEditor ? 'True' : 'False'}, connect_default_device=False)
        globals()['poco'] = poco

    try:
        version = poco.agent.get_sdk_version()
    except:
        pass
    else:
        print("${SDKVersionBoundary}")
        print(version)
        print("${SDKVersionBoundaryEnd}")

get_sdk_version()

# end-proc #
`  
        this.execPy(code)
    }
    onDisconnect() {
        this.pocoProc.kill()
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
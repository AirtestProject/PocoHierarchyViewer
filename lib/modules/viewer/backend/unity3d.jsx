
import React from 'react'
import autoBind from 'react-autobind'
import rp from 'request-promise'
import toastr from 'toastr'

import {Icon} from '../../util/icon'

import {InspectorViewBase} from '../hierarchyViewer'

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

        this.inBox = ''

        this.pocoProc = spawn('python', ['-u', '-m', 'poco.drivers.unity3d.repl'])
        this.pocoProc.stdout.on('data', data => {
            data = data.toString()
            this.inBox += data

            // parse hierarchy
            let hierarchyEndIndex = this.inBox.indexOf(HierarchyBoundaryEnd)
            if (hierarchyEndIndex >= 0) {
                let hierarchyStartIndex = this.inBox.indexOf(HierarchyBoundary)
                let jsonHierarchy = this.inBox.substring(hierarchyStartIndex + HierarchyBoundary.length, hierarchyEndIndex)
                this.setState({hierarchyTree: JSON.parse(jsonHierarchy)})
                this.inBox = this.inBox.substring(hierarchyEndIndex + HierarchyBoundaryEnd.length)
            }

            // parse screen
            let screenEndIndex = this.inBox.indexOf(ScreenBoundaryEnd)
            if (screenEndIndex >= 0) {
                let screenStartIndex = this.inBox.indexOf(ScreenBoundary)
                let screenData = this.inBox.substring(screenStartIndex + ScreenBoundary.length, screenEndIndex)
                this.setState({screen: screenData})
                this.inBox = this.inBox.substring(screenEndIndex + ScreenBoundaryEnd.length)
            }

            // parse profile data
            let profileDataEndIndex = this.inBox.indexOf(ProfileDataBoundaryEnd)
            if (profileDataEndIndex >= 0) {
                let profileDataStartIndex = this.inBox.indexOf(ProfileDataBoundary)
                let jsonProfileData = this.inBox.substring(profileDataStartIndex + ProfileDataBoundary.length, profileDataEndIndex)
                let pfData = JSON.parse(jsonProfileData)
                let {profileData} = this.state
                Object.assign(profileData, pfData)
                this.setState({profileData})
                this.inBox = this.inBox.substring(profileDataEndIndex + ProfileDataBoundaryEnd.length)
            }

            // parse sdk version code
            let sdkVersionCodeEndIndex = this.inBox.indexOf(SDKVersionBoundaryEnd)
            if (sdkVersionCodeEndIndex >= 0) {
                console.log(this.inBox)
                let sdkVersionCodeStartIndex = this.inBox.indexOf(SDKVersionBoundary)
                let versionCodeStr = this.inBox.substring(sdkVersionCodeStartIndex + SDKVersionBoundary.length, sdkVersionCodeEndIndex)
                this.setState({sdkVersionCode: versionCodeStr})
                this.inBox = this.inBox.substring(sdkVersionCodeEndIndex + SDKVersionBoundaryEnd.length)
            }
        })
        this.pocoProc.stderr.on('data', data => {
            data = data.toString()
            console.error(data)
            toastr["warning"](data)
        })
        this.pocoProc.on('close', exitCode => {
            if (exitCode !== 0) {
                let msg = 'This hierarchy viewer require python runtime and poco. Please install poco first by following command.\n"pip install -U pocoui"'
                let option = {closeButton: true, timeOut: 0, extendedTimeOut: 0, onclick: null, tapToDismiss: false}
                toastr["warning"](msg, '', option)
            }
        })

        this.refresh(720)
        this.getSDKVersion()
    }

    execPy(code) {
        this.pocoProc.stdin.write(code)
        this.pocoProc.stdin.write('\n')
    }

    connectAirtestDevice(devUri) {
        let code = `
from airtest.core.api import connect_device
connect_device('${devUri}')
`  
        this.execPy(code)
    }

    refresh(width) {
        let isUnityEditor = this.props.platform === 'windows' && this.props.options.isUnityEditor
        // 只有windows版的非editor mode 才需要主动connect到device
        if (this.props.platform === 'windows' && !this.props.options.isUnityEditor) {
            this.connectAirtestDevice(`Windows:///?title_re=${this.props.options.titleRe}&class_name=UnityWndClass`)
        }

        let code = `
def get_hierarchy_and_screen():
    # cache poco instance globally to speed up
    poco = globals().get('poco')
    if poco is None:
        poco = UnityPoco(("${this.props.ip}", ${this.props.port}), ${isUnityEditor ? 'True' : 'False'}, connect_default_device=False)
        globals()['poco'] = poco

    try:
        h = poco.agent.hierarchy.dump()
    except Exception as e:
        sys.stderr.write('Error: cannot dump hierarchy from remote device. {}'.format(e.message))
        sys.stderr.flush()
    else:
        print("${HierarchyBoundary}")
        print(json.dumps(h))
        print("${HierarchyBoundaryEnd}")

    try:
        pf = poco.agent.get_debug_profiling_data()
        print("${ProfileDataBoundary}")
        print(json.dumps({'dump': pf['dump'], 'dumpSerialize': pf['handleRpcRequest'] - pf['dump']}))
        print("${ProfileDataBoundaryEnd}")
    except Exception as e:
        sys.stderr.write('Error: cannot get debug profiling data from remote device. {}'.format(e.message))
        sys.stderr.flush()

    try:
        s, fmt = poco.snapshot(${width})
    except Exception as e:
        sys.stderr.write('Error: cannot take screenshot from remote device. {}'.format(e.message))
        sys.stderr.flush()
    else:
        print("${ScreenBoundary}")
        print("data:image/" + fmt + ";base64," + s)
        print("${ScreenBoundaryEnd}")

    try:
        pf = poco.agent.get_debug_profiling_data()
        print("${ProfileDataBoundary}")
        print(json.dumps({'screenshot': pf['screenshot']}))
        print("${ProfileDataBoundaryEnd}")
    except Exception as e:
        sys.stderr.write('Error: cannot get debug profiling data from remote device. {}'.format(e.message))
        sys.stderr.flush()

get_hierarchy_and_screen()

# end-proc #
`
        this.execPy(code)
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
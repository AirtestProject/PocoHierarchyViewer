
import React from 'react'
import autoBind from 'react-autobind'
import rp from 'request-promise'

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




export class Unity3dInspectorView extends InspectorViewBase {
    constructor(props) {
        super(props)
        this.state['profileData'] = {
            dump: 0,
            dumpSerialize: 0,
            screenshot: 0,
        }
        autoBind(this)

        this.inBox = ''
        this.errBox = ''

        this.pocoProc = spawn('python', ['-u', '-m', 'poco.drivers.unity3d.repl'])
        this.pocoProc.stdout.on('data', data => {
            data = data.toString()
            // console.log(data)
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
        })
        this.pocoProc.stderr.on('data', data => {
            data = data.toString()
            this.errBox += data
            console.error(data.toString())
        })

        this.refresh(720)
    }

    execPy(code) {
        this.pocoProc.stdin.write(code)
        this.pocoProc.stdin.write('\n')
    }

    refresh(width) {
        let code = `
poco = UnityPoco(("${this.props.ip}", ${this.props.port}), True)

h = poco.agent.hierarchy.dump()
print("${HierarchyBoundary}")
print(json.dumps(h))
print("${HierarchyBoundaryEnd}")

pf = poco.agent.get_debug_profiling_data()
print("${ProfileDataBoundary}")
print(json.dumps({'dump': pf['dump'], 'dumpSerialize': pf['handleRpcRequest'] - pf['dump']}))
print("${ProfileDataBoundaryEnd}")

s, fmt = poco.snapshot(${width})
print("${ScreenBoundary}")
print("data:image/" + fmt + ";base64," + s)
print("${ScreenBoundaryEnd}")

pf = poco.agent.get_debug_profiling_data()
print("${ProfileDataBoundary}")
print(json.dumps({'screenshot': pf['screenshot']}))
print("${ProfileDataBoundaryEnd}")
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
            <small style={{color: 'grey', marginLeft: '10px'}}>{`dump: ${this.state.profileData.dump}ms  dumpSerialize: ${this.state.profileData.dumpSerialize}ms  screenshot: ${this.state.profileData.screenshot}ms`}</small>
        </span>
    }
}
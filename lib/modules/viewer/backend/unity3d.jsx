
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

export class Unity3dInspectorView extends InspectorViewBase {
    constructor(props) {
        super(props)
        autoBind(this)

        this.inBox = ''
        this.errBox = ''

        this.pocoProc = spawn('python', ['-u', '-m', 'poco.drivers.unity3d.repl'])
        this.pocoProc.stdout.on('data', data => {
            data = data.toString()
            console.log(data)
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
                this.inBox = this.inBox.substring(screenEndIndex + screenEndIndex.length)
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

s, fmt = poco.snapshot(${width})
print("${ScreenBoundary}")
print("data:image/" + fmt + ";base64," + s)
print("${ScreenBoundaryEnd}")
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
        </span>
    }
}
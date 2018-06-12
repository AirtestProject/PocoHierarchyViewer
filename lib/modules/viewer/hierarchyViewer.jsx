
import React from 'react'
import autoBind from 'react-autobind'

import {Icon} from '../util/icon'
import {ToolBarButton} from './utils/ToolBarButton'
import {InspectorPanel} from '../base/inspector-panel'

import {globalEventEmitter} from './event'


export class InspectorViewBase extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            hierarchyTree: null,
            screen: '',
            screenWidth: 1920,
            screenHeight: 1080,
        }
        this.handleBackToDeviceSelect = this.handleBackToDeviceSelect.bind(this)
        this.serviceStarted = false
    }

    refresh(width) {
    }
    onDisconnect() {
    }
    renderCustomizedToolbar() {
    }

    handleBackToDeviceSelect() {
        this.onDisconnect()
        globalEventEmitter.emit('disconnect-device')
    }

    componentDidMount() {
        let tryToRefresh = () => {
            if (!this.serviceStarted) {
                setTimeout(() => {
                    tryToRefresh()
                }, 100)
                return
            }
            this.refresh(1920)
                .catch(err => {
                    console.log('service is still starting, try again later.', err)
                    this._refreshTimer = setTimeout(tryToRefresh, 500)
                })
        }
        tryToRefresh()
    }

    render() {
        let customizedToolbarArea = <span style={{marginRight: '20px'}}>
            <ToolBarButton icon='keyboard_backspace' hint='return' onClick={this.handleBackToDeviceSelect} />
            {this.renderCustomizedToolbar()}
        </span>

        return <InspectorPanel 
            hierarchyTree={this.state.hierarchyTree} 
            screen={this.state.screen} 
            screenWidth={this.state.screenWidth} 
            screenHeight={this.state.screenHeight} 
            onRefreshRequest={this.refresh}
            customToolbar={customizedToolbarArea} />
    }
}
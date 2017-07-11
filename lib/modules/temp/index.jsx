
const $ = require('jquery')
const React = require('react')
const ReactDOM = require('react-dom')

import autoBind from 'react-autobind'

import {SPAContainer} from '../base/spa'
import {InspectorPanel} from '../base/inspector-panel'

const adb = window.require('adbkit')
const rp = require('request-promise')

const PocoServicePackage = 'com.netease.open.pocoservice'

class MainView extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            hierarchyTree: null,
            screen: '',
            screenWidth: 1920,
            screenHeight: 1080,
        }
        autoBind(this)

        this.serviceStarted = false
        this.adbClient = adb.createClient()
        this.sn = 'CB5A21QRAW'

        
        this.adbClient.shell(this.sn, `am force-stop ${PocoServicePackage}`)
        this.adbClient.isInstalled(this.sn, PocoServicePackage)
            // 安装
            .then(installed => {
                if (!installed) {
                    return Promise.resolve()
                        .then(() => this.adbClient.push(this.sn, "lib/apk/poco-service.apk", "/data/local/tmp/poco-service.apk"))  // 兼容一下系统
                        .then(() => this.adbClient.shell(this.sn, 'pm install "/data/local/tmp/poco-service.apk"'))
                }
            })
            .then(() => {
                console.log('service installed')
                return Promise.resolve()
                    .then(() => this.adbClient.push(this.sn, "lib/apk/poco-service-androidTest.apk", "/data/local/tmp/poco-service-androidTest.apk"))
                    .then(() => this.adbClient.shell(this.sn, 'pm install -r "/data/local/tmp/poco-service-androidTest.apk"'))
            })
            .then(() => {
                console.log('install success')

                // 启动
                return new Promise(resolve => {
                    setTimeout(() => {
                        this.adbClient.shell(this.sn, `am instrument -w -e class ${PocoServicePackage}.InstrumentedTestAsLauncher#launch ${PocoServicePackage}.test/android.support.test.runner.AndroidJUnitRunner`)
                            .then(adb.util.readAll)
                            .then(output => {
                                console.log(output.toString())
                            })
                        console.log('poco service is starting')
                        setTimeout(() => {
                            // 还要延迟一下子这个service才启动起来
                            resolve()
                        }, 500)
                    }, 500)
                })
                
                
            })
            .then(() => {
                // forward
                console.log('poco service forward to tcp:10080')
                return this.adbClient.forward(this.sn, 'tcp:10080', 'tcp:10080')
            })
            .then(() => {
                console.log('poco service started')
                this.serviceStarted = true
            })
    }

    refresh(width) {
        let hierarchyReq = rp({
            uri: 'http://127.0.0.1:10080/hierarchy',
            json: true,
        })
        let screenSizeReq = rp({
            uri: 'http://127.0.0.1:10080/screen_size',
            json: true,
        })
        let screenReq = rp({
            uri: 'http://127.0.0.1:10080/screen',
            qs: {width: width},
            json: true,
        })
        return Promise.all([hierarchyReq, screenSizeReq, screenReq])
            .then(resp => {
                let [hierarchy, screenSize, screen] = resp
                this.setState({hierarchyTree: hierarchy, screen: `data:image/jpeg;base64,${screen}`, screenWidth: screenSize[0], screenHeight: screenSize[1]})
            })
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
                    setTimeout(tryToRefresh, 500)
                })
        }
        tryToRefresh()
    }
    render() {
        return <InspectorPanel 
            hierarchyTree={this.state.hierarchyTree} 
            screen={this.state.screen} 
            screenWidth={this.state.screenWidth} 
            screenHeight={this.state.screenHeight} 
            onRefreshRequest={this.refresh} />

    }
}

$(document).ready(function () {
    var instructionList = ReactDOM.render(
        <MainView />,
        $('#main').get(0)
    );
})


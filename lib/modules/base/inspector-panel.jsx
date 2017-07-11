
const $ = require('jquery')
const _ = require('lodash')
const uuid = require('uuid-js')
const React = require('react')
const SplitPane = require('react-split-pane')

const IconButton = require('../util/IconButton')
const TreeUtil = require('../util/TreeUtil')
const Misc = require('../util/misc')
const MouseoverComponent = require('../util/mouseover')

import linkState from 'react-link-state'
import autoBind from 'react-autobind'
import {ObjectInspector} from 'react-inspector'
import {Treebeard, decorators, theme as treebeardTheme} from 'react-treebeard'

import * as TreeFilterUtil from '../util/tree-filter'
import {LinkedInput} from '../util/LinkedInput'
import {Icon} from '../util/icon'


// 节点类型优先级，越后面优先级越高
const NodeTypePrioirties = ['Sprite', 'ImageView', 'Label', 'RichText', 'TextField', 'Text', 'Slider', 'CheckBox', 'Button']
const IgnoredCCTypes = ['Node', 'Layer', 'Layout', 'LayerColor', 'Scene', 'Bone', 'Armature', 'ParticleSystemQuad', 'PaletteSprite', 'AvatarLayer', 'AvatarGroupLayer']
const NodeType2IconName = {
    Layer: ['mdi-maps-layers', ''],
    LayerColor: ['mdi-maps-layers', ''],

    Layout: ['mdi-action-view-quilt', ''],
    FrameLayout: ['mdi-action-view-quilt', ''],
    LinearLayout: ['mdi-action-view-quilt', ''],
    RelativeLayout: ['mdi-action-view-quilt', ''],

    ScrollView: ['format_list_bulleted', ''],
    Node: ['share', ''],
    ImageView: ['mdi-image-image', 'lightpink'],
    Sprite: ['mdi-image-image', 'lightpink'],
    Text: ['mdi-content-text-format', 'white'],
    TextView: ['mdi-content-text-format', 'white'],
    RichText: ['mdi-content-text-format', 'white'],
    Label: ['mdi-content-text-format', 'white'],
    TextField: ['mdi-editor-mode-edit', 'yellowgreen'],
    EditText: ['mdi-editor-mode-edit', 'yellowgreen'],
    Button: ['mdi-av-games', 'yellowgreen'],
    ProgressTimer: ['mdi-image-timer', 'lightskyblue'],
    LoadingBar: ['mdi-device-signal-cellular-2-bar', 'lightskyblue'],
    Camera: ['mdi-av-videocam', ''],
    Bone: ['mdi-image-nature', ''],
    ParticleSystemQuad: ['blur_on', ''],
    AvatarLayer: ['person', ''],
    AvatarGroupLayer: ['people', ''],
    PaletteSprite: ['palette', 'gold'],
    Widget: ['widgets', ''],
    CheckBox: ['check_box', 'yellowgreen'],
    Slider: ['adjust', 'yellowgreen'],
}

let getNodeIcon = type => {
    let payloadType = type.split('.')
    payloadType = payloadType[payloadType.length - 1]
    let nodeIcon = NodeType2IconName[payloadType]
    return nodeIcon
}


// hierarchyTreeStyle customize
const hierarchyTreeStyle = _.cloneDeep(treebeardTheme)
const {toggle, header} = hierarchyTreeStyle.tree.node
toggle.base.width = toggle.base.height = '20px'
toggle.wrapper.margin = '-9px 0 0 -5px'
toggle.width = toggle.height = 12
header.title.lineHeight = '20px'
header.title.fontSize = '12px'

// hierarchy tree decorator
const myDecorators = _.cloneDeep(decorators)
myDecorators.Header = props => {
    let baseStyle = props.style.base
    const payload = props.node.payload
    let icon = ''
    let color = ''
    if (payload) {
        if (!payload.visible || payload.parentVisible === false) {
            baseStyle = _.clone(props.style.base)
            baseStyle.opacity = 0.6
        }
        
        let nodeIcon = getNodeIcon(payload.type)
        if (nodeIcon) {
            [icon, color] = nodeIcon
        }
    }
    return <div style={baseStyle}>
        <div style={props.style.title}>
            <Icon icon={icon} size={15} color={color} />{props.node.name}
        </div>
    </div>
}

const hierarchyTreeMatcher = (searchContent, node) => {
    searchContent = searchContent.trim()
    if (searchContent.indexOf('|') >= 0) {
        let matched = false
        for (let cond of searchContent.split('|')) {
            matched = matched || hierarchyTreeMatcher(cond, node)
            if (matched) {
                break
            }
        }
        return matched
    } else if (searchContent.indexOf('&') >= 0) {
        let matched = true
        for (let cond of searchContent.split('&')) {
            matched = matched && hierarchyTreeMatcher(cond, node)
            if (!matched) {
                break
            }
        }
        return matched
    } else if (searchContent.indexOf('=') >= 0) {
        let [attribute, value] = searchContent.split('=', 2)
        let nodeAttr = node.payload[attribute.trim()]
        if (nodeAttr) {
            return nodeAttr.toString().toLowerCase().indexOf(value.trim().toLowerCase()) >= 0
        }
    }
    return node.name.toLowerCase().indexOf(searchContent) >= 0
}


class ElementPane extends MouseoverComponent {
    constructor(props) {
        super(props)
        this.state = Object.assign({
            refreshing: false,
            coordTipsCoord: [0, 0],
            elementDetected: null,    // 只能选择模式检测出来的节点
        }, this.superState())
        autoBind(this)
        this._findOverlayedNode = _.throttle(this._findOverlayedNode, 50, {trailing: false})

        this.ref_coordTips = null
        this.ref_nodeInfoTips = null
        this.ref_imgMask = null
    }


    _findOverlayedNode(offsetX, offsetY) {
        let scaleFactor = this.ref_imgMask.clientWidth / this.props.screenWidth
        let matchedNodes = []
        TreeUtil.traverse(this.props.hierarchyTree, node => {
            let {type, visible, parentVisible, pos, size, anchorPoint, scale} = node.payload
            if (IgnoredCCTypes.indexOf(type) < 0) {
                if (visible && parentVisible !== false) {
                    let [x, y] = pos
                    let [w, h] = size
                    let [ax, ay] = anchorPoint
                    let {left, top, width, height} = this.convertNodePosToRenderPos(x, y, w, h, ax, ay, scaleFactor)
                    if (offsetX >= left && offsetX <= left + width && offsetY >= top && offsetY <= top + height) {
                        matchedNodes.push(node)
                    }
                }
            }
        })
        
        matchedNodes.sort((a, b) => {
            return -a.payload.depthStr.localeCompare(b.payload.depthStr)
        })
        this.setState({elementDetected: matchedNodes[0] || null})
    }
    handleAutoDetectingElement(evt) {
        if (!this.props.elementSelecting) {
            return
        }
        evt.persist()
        let {offsetX, offsetY} = evt.nativeEvent
        this.setState({coordTipsCoord: [offsetX, offsetY]})
        this._findOverlayedNode(offsetX, offsetY)
    }
    handleSelectAutoDetectedElment(evt) {
        if (!this.props.elementSelecting || !this.state.elementDetected) {
            return
        }
        this.props.parent.handleSelectElement(this.state.elementDetected, true)
        TreeUtil.expandNode(this.state.elementDetected)
        this.setState({elementDetected: null})
    }
    handleCancelAutoDetectingElement(evt) {
        if (this.props.elementSelecting) {
            this.props.parent.setState({elementSelecting: false})
            evt.stopPropagation()
            evt.preventDefault()
        }
    }
    handleClearAutuDetectingElementMask() {
        this.setState({elementDetected: null, mouseover: false})
    }

    convertNodePosToRenderPos(x, y, w, h, ax, ay, scale) {
        // scale: scale factor from device screen to browser screen
        // 不需要再求一次宽和高的缩放了，因为在获取节点属性时已经计算到最终宽高值了
        x *= scale
        y *= scale
        w *= scale
        h *= scale
        let bound = {
            left: (x - w * ax), 
            top: (y - h * (1 - ay)),
            width: w,
            height: h,
        }
        return bound
    }
    convertBoundToRenderPos(t, r, b, l, sx, sy, scale, renderW, renderH) {
        t *= scale
        r *= scale
        b *= scale
        l *= scale
        let targetW = renderW - l - r
        let targetH = renderH - t - b
        let x = targetW * (1 - sx) / 2 + l 
        let y = targetH * (1 - sy) / 2 + t
        let w = targetW * sx
        let h = targetH * sy
        return {
            left: x, top: y, width: w, height: h,
        }
    }
    genSelectedElementMask(x, y, w, h, ax, ay, scale, bgColor='rgba(255,244,0,0.2)', borderColor='lightgreen') {
        let bound = this.convertNodePosToRenderPos(x, y, w, h, ax, ay, scale)
        _.forEach(bound, (val, key) => {
            bound[key] = val + 'px'
        })
        return <div style={Object.assign({position: 'absolute', border: `1px solid ${borderColor}`, zIndex: 100, backgroundColor: bgColor}, bound)}></div>
    }
    genElementMaskByMargin(t, r, b, l, sx, sy, scale, rw, rh, bgColor='rgba(255,244,0,0.2)', borderColor='pink') {
        let bound = this.convertBoundToRenderPos(t, r, b, l, sx, sy, scale, rw, rh)
        _.forEach(bound, (val, key) => {
            bound[key] = val + 'px'
        })
        let style = {position: 'absolute', border: `2px dashed ${borderColor}`, zIndex: 90, backgroundColor: bgColor}
        return <div style={Object.assign(style, bound)} ></div>
    }
    genCoordTips() {
        const tipsDisplayOffset = 20
        let [tipsX, tipsY] = this.state.coordTipsCoord 
        let scaleFactor = this.ref_imgMask.clientWidth / this.props.screenWidth
        let bounds = {left: tipsX + tipsDisplayOffset + 'px', top: tipsY + tipsDisplayOffset + 'px'}
        let style = {position: 'absolute', zIndex: 20001, whiteSpace: 'nowrap', fontSize: '12px', backgroundColor: 'rgba(0,0,0,0.4)', padding: '2px'}
        if (this.ref_coordTips) {
            let tipsDisplayWidth = this.ref_coordTips.clientWidth 
            let tipsDisplayHeight = this.ref_coordTips.clientHeight
            if (tipsX + tipsDisplayOffset + tipsDisplayWidth > this.ref_imgMask.clientWidth) {
                bounds.right = '0px'
                delete bounds.left
            }
            if (tipsY + tipsDisplayHeight >= this.ref_imgMask.clientHeight) {
                bounds.bottom = tipsDisplayHeight + 2 + 'px' 
                delete bounds.top
            } else if (tipsY + tipsDisplayOffset + tipsDisplayHeight > this.ref_imgMask.clientHeight) {
                bounds.bottom = '0px' 
                delete bounds.top
            }
        }
        let coordTips = <div ref={r => this.ref_coordTips = r} style={Object.assign(style, bounds)}>{`${parseInt(tipsX / scaleFactor)}, ${parseInt(tipsY / scaleFactor)}`}</div>
        return coordTips
    }
    genNodeInfoTips(node, nodeBounds=null, zIndex=10001) {
        let typename = node.payload.type
        let style = {position: 'absolute', zIndex: zIndex, whiteSpace: 'nowrap', fontSize: '12px', backgroundColor: 'rgba(0,0,0,0.7)'}
        let [icon, color] = ['', '']
        let iconType = getNodeIcon(typename)
        if (iconType) {
            [icon, color] = iconType 
        }
        if (nodeBounds) {
            let bound = {left: nodeBounds.left, top: nodeBounds.top + nodeBounds.height + 1}
            if (this.ref_nodeInfoTips) {
                let nodeInfoTipsWidth = this.ref_nodeInfoTips.clientWidth
                let nodeInfoTipsHeight = this.ref_nodeInfoTips.clientHeight
                if (bound.top > this.ref_imgMask.clientHeight - nodeInfoTipsHeight) {
                    if (nodeBounds.height < this.ref_imgMask.clientHeight / 2) {
                        // 处于底部但又不太高的元素
                        bound.top = nodeBounds.top - nodeInfoTipsHeight
                    } else {
                        // 处于底部很高的元素
                        bound.bottom = 0
                        delete bound.top
                    }
                }
                if (bound.left > this.ref_imgMask.clientWidth - nodeInfoTipsWidth) {
                    bound.right = 0
                    delete bound.left
                }
                if (bound.left < 0) {
                    bound.left = 0
                }
            }
            _.forEach(bound, (val, key) => {
                bound[key] = val + 'px'
            })
            style = Object.assign(style, bound)
        }
        return <div ref={r => this.ref_nodeInfoTips = r} style={style}>
            <div style={{display: 'inline-block', backgroundColor: 'rgba(0,0,0,0.25)', padding: '3px'}}>
                <Icon icon={icon} color={color} size={16} />
                <span style={{fontFamily: 'consolas', display: 'inline-block'}}>{' ' + typename}</span>
            </div>
            <div style={{display: 'inline-block', padding: '3px'}}>{' ' + node.name}</div>
        </div>
    }

    render() {
        let cursor = this.props.hierarchyCursor
        let mask = null
        let anchor = null
        if (cursor && this.ref_imgMask) {
            let scaleFactor = this.ref_imgMask.clientWidth / this.props.screenWidth
            let {pos, size, anchorPoint} = cursor.payload
            mask = this.genSelectedElementMask(pos[0], pos[1], size[0], size[1], anchorPoint[0], anchorPoint[1], scaleFactor)
            let anchorPos = {left: pos[0] * scaleFactor - 1 + 'px', top: pos[1] * scaleFactor - 1 + 'px'}
            anchor = <div style={Object.assign({position: 'absolute', border: '2px solid orangered', zIndex: 101, width: '3px', height: '3px'}, anchorPos)}></div>
        }

        let marginMask = null
        if (cursor && this.ref_imgMask && cursor.payload.margin) {
            let scaleFactor = this.ref_imgMask.clientWidth / this.props.screenWidth
            let [top, right, bottom, left] = cursor.payload.margin
            let [sx, sy] = cursor.payload.scale
            let rw = this.ref_imgMask.clientWidth
            let rh = this.props.screenHeight * scaleFactor  // 通过屏幕比例自动算出高，因为这个imgMask的height会随着splite pane而变化
            marginMask = this.genElementMaskByMargin(top, right, bottom, left, sx, sy, scaleFactor, rw, rh, 'rgba(0,128,255,0.2)')
        }

        let dynamicMask = null
        if (this.state.elementDetected && this.ref_imgMask) {
            let scaleFactor = this.ref_imgMask.clientWidth / this.props.screenWidth
            let {pos, size, anchorPoint} = this.state.elementDetected.payload
            dynamicMask = this.genSelectedElementMask(pos[0], pos[1], size[0], size[1], anchorPoint[0], anchorPoint[1], scaleFactor, 'rgba(0, 128, 255, 0.3)')
        }

        let nodeInfoTips = null
        if (this.ref_imgMask) {
            let scaleFactor = this.ref_imgMask.clientWidth / this.props.screenWidth
            if (this.state.elementDetected && this.ref_imgMask) {
                let {pos, size, anchorPoint} = this.state.elementDetected.payload
                let nodeBounds = this.convertNodePosToRenderPos(pos[0], pos[1], size[0], size[1], anchorPoint[0], anchorPoint[1], scaleFactor)
                nodeInfoTips = this.genNodeInfoTips(this.state.elementDetected, nodeBounds)
            } else if (cursor && this.ref_imgMask) {
                let {pos, size, anchorPoint} = cursor.payload
                let nodeBounds = this.convertNodePosToRenderPos(pos[0], pos[1], size[0], size[1], anchorPoint[0], anchorPoint[1], scaleFactor)
                nodeInfoTips = this.genNodeInfoTips(cursor, nodeBounds, 200000)
            }
        }


        return <div style={{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0}}>
            <div style={{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 99999}} 
                onMouseMove={this.handleAutoDetectingElement} 
                onMouseOut={this.handleClearAutuDetectingElementMask} 
                onClick={this.handleSelectAutoDetectedElment}
                onContextMenu={this.handleCancelAutoDetectingElement}
                onMouseEnter={this.handleMouseEnter} 
                >
            </div>
            {this.state.refreshing && <div style={{position: 'absolute', left: 0, right: 0, top: '40%', height: '90px', lineHeight: '90px', textAlign: 'center', fontSize: '26px', zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.5)'}}>处理中...</div>}
            <div ref={r => this.ref_imgMask = r} style={{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0}}>
                {nodeInfoTips}
                {this.state.mouseover && this.props.elementSelecting && this.genCoordTips()}
                {this.props.elementSelecting && dynamicMask}
                {!dynamicMask && !this.state.elementDetected && mask}
                {!dynamicMask && !this.state.elementDetected && anchor}
            </div>
            <img ref='img' src={this.props.screen} style={{width: '100%'}} />
        </div>
    }
}

ElementPane.propTypes = {
    target: React.PropTypes.object,
    elementSelecting: React.PropTypes.bool,
    hierarchyCursor: React.PropTypes.object,
    hierarchyTree: React.PropTypes.object,
    screen: React.PropTypes.string,
    screenWidth: React.PropTypes.number,
    screenHeight: React.PropTypes.number,
}

export class InspectorPanel extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            // the game client's real resolutions
            elementSelecting: false,  // 正在使用智能选择模式
            elementPaneWidth: 720,

            hierarchyTreeNodeMap: {},  // node.uuid -> node
            hierarchyCursor: null,
            hierarchyTreeSearchContent: '',
            hierarchyShowInvisibleNode: false,
        }
        autoBind(this)

        this.ref_elementPath = null
        this.ref_hierarchyPane = null
        this.ref_attributePane = null
    }
    handleSelectElement(node, toggled) {
        console.log(node)
        if (node.name === undefined) {
            return
        }
        if (this.state.hierarchyCursor) {
            let cursor = this.state.hierarchyTreeNodeMap[this.state.hierarchyCursor.uuid]
            if (cursor) {
                cursor.active = false
            }
        }
        let originNode = this.state.hierarchyTreeNodeMap[node.uuid]
        originNode.active = true
        if (originNode.children) {
            originNode.toggled = !originNode.toggled
        }
        this.setState({hierarchyCursor: node, elementSelecting: false})
    }
    handleHierarchyUpdate(hierarchyTree) {
        let hierarchyTreeNodeMap = {}

        // check parent visiblility
        let makeChildInvisible = node => {}
        makeChildInvisible = node => {
            let {visible, parentVisible} = node.payload
            if (node.children) {
                let childParentVisible = visible && parentVisible !== false
                for (let child of node.children) {
                    child.payload.parentVisible = childParentVisible
                    makeChildInvisible(child)
                }
            }
        }
        makeChildInvisible(hierarchyTree)

        // ensure parent
        let ensureParentNode = node => {}
        ensureParentNode = node => {
            if (node.children) {
                for (let child of node.children) {
                    child.parent = node
                    ensureParentNode(child)
                }
            }
        }
        ensureParentNode(hierarchyTree)

        // generate uuid on each node
        TreeUtil.traverse(hierarchyTree, node => {
            if (!node.uuid) {
                node.uuid = uuid.create().toString()  // v4
                hierarchyTreeNodeMap[node.uuid] = node
            }
        })
        
        // expand to level 3
        TreeUtil.expand(hierarchyTree, 3)

        this.setState({
            hierarchyTreeNodeMap,  
            hierarchyCursor: null, elementSelecting: false, 
        })
    }
    handleCopyPath() {
        Misc.copyToClipboard(this.ref_elementPath)
    }

    sendClickEvent() {
        let uri = this.resourceManager.get('/addon/inspector/rpc/uri')
        if (uri && this.state.hierarchyCursor) {
            let remoteObj = this.rpc.getObject(uri)
            remoteObj.invoke('sendClickEvent', [this.state.hierarchyCursor.path])
        }
    }
    toggleShowInvisibileNode() {
        this.setState({hierarchyShowInvisibleNode: !this.state.hierarchyShowInvisibleNode})
    }
    handleMainSplitePaneResized(size) {
        this.setState({elementPaneWidth: size})
    }
    handleToggleAutoDetectingMode() {
        let detecting = this.state.elementSelecting
        this.setState({elementSelecting: !detecting})
        if (detecting) {
            // 关闭auto detecting时，要把detected element清除掉
            this.setState({elementDetected: null})
        }
    }
    handleRefreshRequest() {
        this.props.onRefreshRequest(this.state.elementPaneWidth)
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.hierarchyTree) {
            this.handleHierarchyUpdate(nextProps.hierarchyTree)
        }
    }
    componentDidMount() {
        $(this.ref_hierarchyPane).on('mousewheel', evt => {
            evt.stopImmediatePropagation()
        })
        $(this.ref_attributePane).on('mousewheel', evt => {
            evt.stopImmediatePropagation()
        })
    }
    componentWillUnmount() {
        $(this.ref_hierarchyPane).unbind('mousewheel')
        $(this.ref_attributePane).unbind('mousewheel')
    }
    render() {
        let cursor = this.state.hierarchyCursor

        // hierarchy tree filter: search/conditions
        let tree = this.props.hierarchyTree
        if (tree) {
            // invisible nodes
            if (!this.state.hierarchyShowInvisibleNode) {
                tree = TreeFilterUtil.filterTreeStrict(tree, true, (_, node) => {
                    return node.payload.visible 
                })
            }

            // filter by node name
            let hierarchyTreeSearchContent = this.state.hierarchyTreeSearchContent.trim().toLowerCase()
            if (hierarchyTreeSearchContent.length > 1) {
                tree = TreeFilterUtil.filterTree(tree, hierarchyTreeSearchContent, hierarchyTreeMatcher) 
                tree = TreeFilterUtil.expandFilteredNodes(tree, hierarchyTreeSearchContent, hierarchyTreeMatcher)
            }
        }

        const toolBarButton = (icon, hint, onClick, btnClass='-') => {
            return <IconButton onClick={onClick} btnClass={btnClass} iconStyle={{fontSize: '20px'}} btnStyle={{marginRight: '4px'}} icon={icon} hint={hint} />
        }

        // 3 panes
        const hierarchyPane = <div ref={r => this.ref_hierarchyPane = r}>
            <div style={{padding: '4px'}}>
                <LinkedInput style={{height: '25px'}} placeholder='search' valueLink={linkState(this, 'hierarchyTreeSearchContent')} />
            </div>
            {!!tree && <Treebeard data={tree} onToggle={this.handleSelectElement} style={hierarchyTreeStyle} decorators={myDecorators} />}
        </div>
        const elementPane = <ElementPane parent={this} elementSelecting={this.state.elementSelecting} hierarchyCursor={cursor} hierarchyTree={this.props.hierarchyTree} screen={this.props.screen} screenWidth={this.props.screenWidth} screenHeight={this.props.screenHeight} />
        const attributePane = <div ref={r => this.ref_attributePane = r}> 
            {!!cursor && <div style={{padding: '3px'}}>
                <div>path:  
                    <kbd ref={r => this.ref_elementPath = r} style={{fontSize: '12px', marginLeft: '5px'}}>{cursor.path}</kbd>
                    <IconButton icon='mdi-content-content-copy' hint='copy' onClick={this.handleCopyPath} iconStyle={{fontSize: '14px', verticalAlign: 'baseline'}}/>
                </div>
                <div style={{marginTop: '3px'}}>
                    <ObjectInspector theme="chromeDark" data={cursor.payload} name={cursor.name} expandLevel={1} />
                </div>
            </div>}
        </div>
        return <div>
            <div style={{height: '25px', padding: '2px 10px'}}>
                {toolBarButton('border_outer', '选择', this.handleToggleAutoDetectingMode, this.state.elementSelecting ? 'color-primary' : '-')}
                {toolBarButton('mdi-navigation-refresh', '刷新', this.handleRefreshRequest)}
                {false && !!cursor && toolBarButton('mdi-maps-my-location', '点击测试(尚未完成)', this.sendClickEvent)}
                {false && toolBarButton(this.state.hierarchyShowInvisibleNode ? 'mdi-action-visibility': 'mdi-action-visibility-off', '显示invisible节点', this.toggleShowInvisibileNode, this.state.hierarchyShowInvisibleNode ? 'color-primary' : '-')}
            </div>
            <div style={{position: 'absolute', top: '25px', right: 0, bottom: 0, left: 0}}>
                {function () {
                    if (this.props.screenHeight > this.props.screenWidth) {
                        return <SplitPane split='vertical' defaultSize={405} onChange={this.handleMainSplitePaneResized} pane1Style={{overflow: 'hidden'}} pane2Style={{overflow: 'auto'}} >
                                {elementPane}
                            <SplitPane split='vertical' defaultSize={450}>
                                {hierarchyPane}
                                {attributePane}
                            </SplitPane>
                        </SplitPane>
                    } else {
                        return <SplitPane split='vertical' defaultSize={720} onChange={this.handleMainSplitePaneResized} >
                            <SplitPane split='horizontal' defaultSize={405} pane1Style={{overflow: 'hidden'}} pane2Style={{overflow: 'auto'}} >
                                {elementPane}
                                {attributePane}
                            </SplitPane>
                            {hierarchyPane}
                        </SplitPane>
                    }
                }.bind(this) ()}
            </div>
        </div>
    }
}

InspectorPanel.propTypes = {
    hierarchyTree: React.PropTypes.object,
    screen: React.PropTypes.string,
    screenWidth: React.PropTypes.number,
    screenHeight: React.PropTypes.number,
    onRefreshRequest: React.PropTypes.func,
}

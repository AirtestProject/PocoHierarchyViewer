
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
    Image: ['mdi-image-image', 'lightpink'],
    View: ['view_agenda', ''],
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
            refreshing: true,
            coordTipsCoord: [0, 0],
            elementDetected: null,    // 只能选择模式检测出来的节点
        }, this.superState())
        autoBind(this)
        this._findOverlayedNode = _.throttle(this._findOverlayedNode, 50, {trailing: false})

        this.ref_coordTips = null
        this.ref_nodeInfoTips = null
        this.ref_imgMask = null
        this.ref_img = null
    }

    _findOverlayedNode(offsetX, offsetY) {
        let scaleFactorX = this.ref_img.clientWidth
        let scaleFactorY = this.ref_img.clientHeight
        let matchedNodes = []
        TreeUtil.traverse(this.props.hierarchyTree, node => {
            let {type, visible, parentVisible, pos, size, anchorPoint, scale} = node.payload
            if (IgnoredCCTypes.indexOf(type) < 0) {
                if (visible && parentVisible !== false) {
                    let [x, y] = pos
                    let [w, h] = size
                    let [ax, ay] = anchorPoint
                    let {left, top, width, height} = this.convertNodePosToRenderPos(x, y, w, h, ax, ay, scaleFactorX, scaleFactorY)
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
        if (!this.props.hierarchyTree) {
            return
        }
        evt.persist()
        let {offsetX, offsetY} = evt.nativeEvent
        this.setState({coordTipsCoord: [offsetX, offsetY]})
        this._findOverlayedNode(offsetX, offsetY)
    }
    handleSelectAutoDetectedElment(evt) {
        if (!this.state.elementDetected) {
            return
        }
        this.props.parent.handleSelectElement(this.state.elementDetected, true)
        TreeUtil.expandNode(this.state.elementDetected)
        this.setState({elementDetected: null})
    }
    handleCancelAutoDetectingElement(evt) {
        evt.stopPropagation()
        evt.preventDefault()
    }
    handleClearAutuDetectingElementMask() {
        this.setState({elementDetected: null, mouseover: false})
    }

    convertNodePosToRenderPos(x, y, w, h, ax, ay, _sx, _sy) {
        // _sx: scale factor from [0, 1] to browser screen
        // 不需要再求一次宽和高的缩放了，因为在获取节点属性时已经计算到最终宽高值了
        x *= _sx
        y *= _sy
        w *= _sx
        h *= _sy
        let bound = {
            left: (x - w * ax), 
            top: (y - h * ay),
            width: w,
            height: h,
        }
        return bound
    }
    genSelectedElementMask(x, y, w, h, ax, ay, sx, sy, bgColor='rgba(255,244,0,0.2)', borderColor='lightgreen') {
        let bound = this.convertNodePosToRenderPos(x, y, w, h, ax, ay, sx, sy)
        _.forEach(bound, (val, key) => {
            bound[key] = val + 'px'
        })
        return <div style={Object.assign({position: 'absolute', border: `1px solid ${borderColor}`, zIndex: 100, backgroundColor: bgColor}, bound)}></div>
    }

    genCoordTips() {
        const tipsDisplayOffset = 20
        let [tipsX, tipsY] = this.state.coordTipsCoord 
        let scaleFactorX = this.ref_img.clientWidth
        let scaleFactorY = this.ref_img.clientHeight
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
        let coordTips = <div ref={r => this.ref_coordTips = r} style={Object.assign(style, bounds)}>{`${parseInt(tipsX / scaleFactorX * this.props.screenWidth)}, ${parseInt(tipsY / scaleFactorY * this.props.screenHeight)}`}</div>
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
    componentWillReceiveProps(nextProps) {
        this.setState({refreshing: false})
    }
    componentDidMount(nextProps) {
        if (this.props.screen) {
            this.setState({refreshing: false})
        }
    }

    render() {
        let cursor = this.props.hierarchyCursor
        
        // square mask
        let mask = null
        let anchor = null
        if (cursor && this.ref_imgMask) {
            let scaleFactorX = this.ref_img.clientWidth
            let scaleFactorY = this.ref_img.clientHeight
            let {pos, size, anchorPoint} = cursor.payload
            mask = this.genSelectedElementMask(pos[0], pos[1], size[0], size[1], anchorPoint[0], anchorPoint[1], scaleFactorX, scaleFactorY)
            let anchorPos = {left: pos[0] * scaleFactorX - 1 + 'px', top: pos[1] * scaleFactorY - 1 + 'px'}  // 这点往左上角偏移一个像素
            anchor = <div style={Object.assign({position: 'absolute', border: '2px solid orangered', zIndex: 101, width: '3px', height: '3px'}, anchorPos)}></div>
        }
        let maskForSelecting = null
        if (this.ref_imgMask && this.state.elementDetected) {
            let scaleFactorX = this.ref_img.clientWidth
            let scaleFactorY = this.ref_img.clientHeight
            let {pos, size, anchorPoint} = this.state.elementDetected.payload
            maskForSelecting = this.genSelectedElementMask(pos[0], pos[1], size[0], size[1], anchorPoint[0], anchorPoint[1], scaleFactorX, scaleFactorY, 'rgba(0, 128, 255, 0.3)')
        }

        // type and name info tips
        let nodeInfoTips = null
        if (this.ref_imgMask && cursor) {
            let scaleFactorX = this.ref_img.clientWidth
            let scaleFactorY = this.ref_img.clientHeight
            let {pos, size, anchorPoint} = cursor.payload
            let nodeBounds = this.convertNodePosToRenderPos(pos[0], pos[1], size[0], size[1], anchorPoint[0], anchorPoint[1], scaleFactorX, scaleFactorY)
            nodeInfoTips = this.genNodeInfoTips(cursor, nodeBounds, 200000)
        }
        let nodeInfoTipsForSelecting = null
        if (this.ref_imgMask && this.state.elementDetected) {
            let scaleFactorX = this.ref_img.clientWidth
            let scaleFactorY = this.ref_img.clientHeight
            let {pos, size, anchorPoint} = this.state.elementDetected.payload
            let nodeBounds = this.convertNodePosToRenderPos(pos[0], pos[1], size[0], size[1], anchorPoint[0], anchorPoint[1], scaleFactorX, scaleFactorY)
            nodeInfoTipsForSelecting = this.genNodeInfoTips(this.state.elementDetected, nodeBounds, 10000)
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
                {mask}
                {anchor}
                {this.state.mouseover && nodeInfoTipsForSelecting}
                {this.state.mouseover && this.genCoordTips()}
                {this.state.mouseover && maskForSelecting}
            </div>
            <img ref={r => this.ref_img = r} src={this.props.screen} style={{width: '100%'}} />
        </div>
    }
}

ElementPane.propTypes = {
    target: React.PropTypes.object,
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
            elementPaneWidth: 720,

            hierarchyTreeNodeMap: {},  // node.uuid -> node
            hierarchyCursor: null,
            hierarchyTreeSearchContent: '',
            hierarchyShowInvisibleNode: false,  // 保留，暂未使用
        }
        autoBind(this)

        this.ref_elementPane = null
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
        this.setState({hierarchyCursor: node})
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
            }
            hierarchyTreeNodeMap[node.uuid] = node
        })
        
        // expand to level 3
        TreeUtil.expand(hierarchyTree, 3)

        this.setState({
            hierarchyTreeNodeMap,  
            hierarchyCursor: null,
        })
    }
    handleCopyPath() {
        Misc.copyToClipboard(this.ref_elementPath)
    }

    sendClickEvent() {
        // 保留，暂未完成
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
    handleRefreshRequest() {
        this.ref_elementPane.setState({refreshing: true, screen: ''})
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
            return <IconButton onClick={onClick} btnClass={btnClass} iconStyle={{fontSize: '20px'}} btnStyle={{marginRight: '4px'}} icon={icon} hint={hint} hintPlacement='bottom' />
        }

        // 3 panes
        const hierarchyPane = <div ref={r => this.ref_hierarchyPane = r}>
            <div style={{padding: '4px'}}>
                <LinkedInput style={{height: '25px'}} placeholder='search' valueLink={linkState(this, 'hierarchyTreeSearchContent')} />
            </div>
            {!!tree && <Treebeard data={tree} onToggle={this.handleSelectElement} style={hierarchyTreeStyle} decorators={myDecorators} />}
        </div>
        const elementPane = <ElementPane ref={r => this.ref_elementPane = r} parent={this} elementSelecting={this.state.elementSelecting} hierarchyCursor={cursor} hierarchyTree={this.props.hierarchyTree} screen={this.props.screen} screenWidth={this.props.screenWidth} screenHeight={this.props.screenHeight} />
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
                {this.props.customToolbar}
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

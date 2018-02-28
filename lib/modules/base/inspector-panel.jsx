const _ = require('lodash')
const uuid = require('uuid-js')
const React = require('react')
const SplitPane = require('react-split-pane')

const IconButton = require('../util/IconButton')
const TreeUtil = require('../util/TreeUtil')
const Misc = require('../util/misc')
const MouseoverComponent = require('../util/mouseover')
const PopoverModal = require('../util/PopoverModal')

import linkState from 'react-link-state'
import autoBind from 'react-autobind'
import {ObjectInspector} from 'react-inspector'
import {Treebeard, decorators, theme as treebeardTheme} from 'react-treebeard'

import * as TreeFilterUtil from '../util/tree-filter'
import {LinkedInput} from '../util/LinkedInput'
import {Icon} from '../util/icon'


// 节点类型优先级，越后面优先级越高
const IgnoredCCTypes = ['Node', 'Layer', 'Layout', 'Mask', 'VBox', 'HBox', 'RelativeLayout', 'LinearLayout', 'FrameLayout', 'LayerColor', 'Scene', 'Bone', 'Animator', 'Armature', 'ParticleSystemQuad', 'PaletteSprite', 'AvatarLayer', 'AvatarGroupLayer']
const NodeType2IconName = {
    Layer: ['mdi-maps-layers', ''],
    Mask: ['mdi-maps-layers', ''],
    LayerColor: ['mdi-maps-layers', ''],

    Layout: ['mdi-action-view-quilt', ''],
    FrameLayout: ['mdi-action-view-quilt', ''],
    LinearLayout: ['mdi-action-view-quilt', ''],
    RelativeLayout: ['mdi-action-view-quilt', ''],
    VBox: ['view_stream', ''],
    HBox: ['view_column', ''],

    ScrollView: ['format_list_bulleted', ''],
    ScrollRect: ['format_list_bulleted', ''],
    ScrollBar: ['clear_all', ''],
    Node: ['share', ''],
    GameObject: ['home', ''],
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
    InputField: ['mdi-editor-mode-edit', 'yellowgreen'],
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
    Selectable: ['select_all', ''], 
    Toggle: ['radio_button_checked', 'yellowgreen'],
    ToggleGroup: ['radio_button_checked', 'yellowgreen'],
    DropDown: ['arrow_drop_down_circle', 'yellowgreen'],
    Animator: ['rowing', ''],

    model: ['home', ''],
    sfx: ['star', ''],
}


let transformType = type => {
    let payloadType = type.split('.')
    payloadType = payloadType[payloadType.length - 1]
    return payloadType
}

let getNodeIcon = type => {
    let payloadType = transformType(type)
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


// integer elements only
const arrayCompare = (a, b) => {
    let i = 0;
    let j = 0;
    while(i < a.length && j < b.length) {
        if (a[i] === b[j]) {
            i++;
            j++;
            continue
        }
        return a[i] - b[j]
    }
    if (a.length < b.length) {
        return -1
    } else if (a.length > b.length) {
        return 1
    } else {
        return a[i - 1] - b[j - 1]
    }
}

const convertNodePosToRenderPos = (x, y, w, h, ax, ay, _sx, _sy) => {
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

class NodeInfoTips extends React.Component {
    constructor(props) {
        super(props)
        autoBind(this)
    }
    stopContextMenu(e) {
        e.stopPropagation()
        e.preventDefault()
    }
    render() {
        let node = this.props.node

        // node info tips
        let typename = node.payload.type
        let [icon, color] = ['', '']
        let iconType = getNodeIcon(typename)
        if (iconType) {
            [icon, color] = iconType 
        }

        return <span onContextMenu={this.stopContextMenu}>
            <div style={{display: 'inline-block', backgroundColor: 'rgba(0,0,0,0.25)', padding: '3px'}}>
                <Icon icon={icon} color={color} size={16} />
                <span style={{fontFamily: 'consolas', display: 'inline-block'}}>{' ' + typename}</span>
            </div>
            <div style={{display: 'inline-block', padding: '3px'}}>{' ' + node.name}</div>
        </span>
    }
}

class NodeMask extends React.Component {
    constructor(props) {
        super(props)
        autoBind(this)
        this.ref_infoTips = null
    }
    render() {
        let node = this.props.node
        let {pos, size, anchorPoint} = node.payload
        let nodeBounds = convertNodePosToRenderPos(pos[0], pos[1], size[0], size[1], anchorPoint[0], anchorPoint[1], this.props.paneWidth, this.props.paneHeight)
        let zIndex = this.props.zIndex || 10001
        let refImgMaskLayer = this.props.refImgMaskLayer

        // node info tips bounds
        let style = {position: 'absolute', zIndex: zIndex, whiteSpace: 'nowrap', fontSize: '12px', backgroundColor: 'rgba(0,0,0,0.7)'}
        let bound = {left: nodeBounds.left, top: nodeBounds.top + nodeBounds.height + 1}
        if (this.ref_infoTips) {
            let nodeInfoTipsWidth = this.ref_infoTips.clientWidth
            let nodeInfoTipsHeight = this.ref_infoTips.clientHeight
            if (bound.top > refImgMaskLayer.clientHeight - nodeInfoTipsHeight) {
                if (nodeBounds.height < refImgMaskLayer.clientHeight / 2) {
                    // 处于底部但又不太高的元素
                    bound.top = nodeBounds.top - nodeInfoTipsHeight
                } else {
                    // 处于底部很高的元素
                    bound.bottom = 0
                    delete bound.top
                }
            }
            if (bound.left > refImgMaskLayer.clientWidth - nodeInfoTipsWidth) {
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

        // square mask
        let mask = this.props.mask || {}
        let fill = mask.fill || 'rgba(255,244,0,0.2)'
        let stroke = mask.stroke || 'lightgreen'
        let anchorPos = {left: pos[0] * this.props.paneWidth - 1 + 'px', top: pos[1] * this.props.paneHeight - 1 + 'px'}  // 这点往左上角偏移一个像素

        return <div>
            <div ref={r => this.ref_infoTips = r} style={style}>
                <NodeInfoTips node={node} /> 
            </div>
            <div style={Object.assign({position: 'absolute', border: `1px solid ${stroke}`, zIndex: 100, backgroundColor: fill}, nodeBounds)}></div>
            <div style={Object.assign({position: 'absolute', border: '2px solid orangered', zIndex: 101, width: '3px', height: '3px'}, anchorPos)}></div>
        </div>
    }
}


class NodeInfoTipsButton extends MouseoverComponent {
    constructor(props) {
        super(props)
        autoBind(this)
    }
    handleSelecting(e) {
        this.handleMouseEnter(e)
        if (this.props.onSelecting) {
            this.props.onSelecting(this.props.node)
        }
    }
    handleSelected(e) {
        if (this.props.onSelected) {
            this.props.onSelected(this.props.node)
        }
    }
    stopContextMenu(e) {
        e.stopPropagation()
        e.preventDefault()
    }
    render() {
        let node = this.props.node
        let backgroundColor = this.state.mouseover ? '#333' : ''
        let nodetype = transformType(node.payload.type)
        let opacity = IgnoredCCTypes.indexOf(nodetype) < 0 ? 1 : 0.6
        if (this.props.parentMouseover) {
            if (this.state.mouseover) {
                opacity = IgnoredCCTypes.indexOf(nodetype) < 0 ? 1 : 0.7
            } else {
                opacity = IgnoredCCTypes.indexOf(nodetype) < 0 ? 0.3 : 0.2
            }
        }
        return <div style={{fontSize: '12px', lineHeight: '12px', backgroundColor, opacity, cursor: 'default'}} className='not-selectable' onMouseEnter={this.handleSelecting} onMouseLeave={this.handleMouseLeave} onClick={this.handleSelected} onContextMenu={this.stopContextMenu}>
            <NodeInfoTips node={node} />
        </div>
    }
}


class NodesSelectionContextMenu extends MouseoverComponent { 
    constructor(props) {
        super(props)
        this.ref_this = null
    }
    render() {
        let elementsUnderneath = _.map(this.props.elementDetectedAllLink.value, node => {
            const onSelected = n2 => {
                this.props.parent.props.parent.handleSelectElement(n2, true)
                TreeUtil.expandNode(n2)
                this.props.parent.setState({elementDetected: null})
                this.props.elementDetectedAllLink.requestChange([])
            }
            const onSelecting = n2 => {
                this.props.parent.setState({elementDetected: n2, mouseover: true})
            }
            return <NodeInfoTipsButton key={node.uuid} node={node} onSelecting={onSelecting} onSelected={onSelected} parentMouseover={this.state.mouseover} />
        })

        let [x, y] = this.props.offset
        if (this.ref_this) {
            let width = this.ref_this.clientWidth
            let height = this.ref_this.clientHeight
            if (x + width > this.props.paneWidth) {
                x = this.props.paneWidth - width
                if (x < 0) {
                    x = 0
                }
            }
            if (y + height > this.props.paneHeight) {
                y = this.props.paneHeight - height
                if (y < 0) {
                    y = 0
                }
            }
        }
        return <div ref={r => this.ref_this = r} style={{position: 'absolute', left: x, top: y, backgroundColor: 'rgba(0,0,0,0.7)', padding: '4px', zIndex: 300000}} onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
            {elementsUnderneath}
        </div>
    }
}


class ElementPane extends MouseoverComponent {
    constructor(props) {
        super(props)
        this.state = Object.assign({
            refreshing: true,
            coordTipsCoord: [0, 0],
            elementDetected: null,    // 只能选择模式检测出来的节点

            elementDetectedAll: [],
            underneathElementsTipsOffsets: [0, 0],
        }, this.superState())
        autoBind(this)
        this._findOverlayedNode = _.throttle(this._findOverlayedNode, 50, {trailing: false})

        this.ref_this = null
        this.ref_coordTips = null
        this.ref_nodeInfoTips = null
        this.ref_nodeInfoTips_float = null
        this.ref_imgMask = null
    }

    _getAllNodesUnder(px, py, all=false) {
        let scaleFactorX = this.props.paneWidth
        let scaleFactorY = this.props.paneHeight
        let matchedNodes = []
        TreeUtil.traverse(this.props.hierarchyTree, node => {
            let {type, visible, parentVisible, pos, size, anchorPoint, scale} = node.payload
            type = transformType(type)
            if (all || IgnoredCCTypes.indexOf(type) < 0) {
                if (visible && parentVisible !== false) {
                    let [x, y] = pos
                    let [w, h] = size
                    let [ax, ay] = anchorPoint
                    let {left, top, width, height} = convertNodePosToRenderPos(x, y, w, h, ax, ay, scaleFactorX, scaleFactorY)
                    if (px >= left && px <= left + width && py >= top && py <= top + height) {
                        matchedNodes.push(node)
                    }
                }
            }
        })
        matchedNodes.sort((a, b) => {
            return -arrayCompare(a.payload.depthLst, b.payload.depthLst)
        })
        return matchedNodes
    }

    _findOverlayedNode(offsetX, offsetY) {
        let elementDetected = this._getAllNodesUnder(offsetX, offsetY)[0] || null
        this.setState({elementDetected})
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
        this.setState({elementDetected: null, elementDetectedAll: []})
    }
    handleClearAutuDetectingElementMask() {
        this.setState({elementDetected: null, mouseover: false})
    }

    genCoordTips() {
        const tipsDisplayOffset = 20
        let [tipsX, tipsY] = this.state.coordTipsCoord 
        let scaleFactorX = this.props.paneWidth
        let scaleFactorY = this.props.paneHeight
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
    componentWillReceiveProps(nextProps) {
        this.setState({refreshing: false})
    }
    componentDidMount() {
        if (this.props.screen) {
            this.setState({refreshing: false})
        }
    }
    handleViewAllNodesUnder(evt) {
        console.log(evt)
        evt.persist()
        evt.preventDefault()
        let {offsetX, offsetY, shiftKey} = evt.nativeEvent
        let nodes = this._getAllNodesUnder(offsetX, offsetY, shiftKey)
        this.setState({elementDetectedAll: nodes, underneathElementsTipsOffsets: [offsetX, offsetY]})
        console.log(nodes)
    }

    render() {
        let cursor = this.props.hierarchyCursor
        let imgFlip = this.props.screenFlipX ? 'scaleY(-1)' : ''
        
        return <div style={{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0}} onContextMenu={this.handleViewAllNodesUnder} >
            <div style={{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 99999}} 
                onMouseMove={this.handleAutoDetectingElement} 
                onMouseOut={this.handleClearAutuDetectingElementMask} 
                onClick={this.handleSelectAutoDetectedElment}
                onMouseEnter={this.handleMouseEnter} 
                >
            </div>
            {this.state.refreshing && <div style={{position: 'absolute', left: 0, right: 0, top: '40%', height: '90px', lineHeight: '90px', textAlign: 'center', fontSize: '26px', zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.5)'}}>处理中...</div>}
            {this.state.elementDetectedAll.length > 0 && <NodesSelectionContextMenu parent={this} offset={this.state.underneathElementsTipsOffsets} elementDetectedAllLink={linkState(this, 'elementDetectedAll')} paneWidth={this.props.paneWidth} paneHeight={this.props.paneHeight} />}
            <div ref={r => this.ref_imgMask = r} style={{position: 'absolute', left: 0, top: 0, right: 0, bottom: 0}}>
                {!!cursor && <NodeMask node={cursor} refImgMaskLayer={this.ref_imgMask} paneWidth={this.props.paneWidth} paneHeight={this.props.paneHeight} zIndex={200000} />}
                {this.state.mouseover && !!this.state.elementDetected && 
                    <NodeMask node={this.state.elementDetected} mask={{fill: 'rgba(0,128,255,0.3)'}} refImgMaskLayer={this.ref_imgMask} paneWidth={this.props.paneWidth} paneHeight={this.props.paneHeight} zIndex={10000} />
                }
                {this.state.mouseover && this.genCoordTips()}
            </div>
            <img src={this.props.screen} style={{width: '100%', transform: imgFlip}} />
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
    paneWidth: React.PropTypes.number,
    paneHeight: React.PropTypes.number,
}

export class InspectorPanel extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            // the game client's real resolutions
            elementPaneWidth: 720,

            hierarchyTree: this.props.hierarchyTree,
            hierarchyTreeNodeMap: {},  // node.uuid -> node
            hierarchyCursor: null,
            hierarchyTreeSearchContent: '',
            hierarchyShowInvisibleNode: false,  // 保留，暂未使用

            screen: this.props.screen,

            // raw hierarchy states
            showPastePanel: false,
            rawHierarchyPasted: '',
            rawScreenPasted: '',
            rawScreenFormatPasted: 'jpg',
        }
        autoBind(this)

        this.ref_elementPane = null
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
        console.log(hierarchyTree)
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

        // generate depthLst
        if (hierarchyTree.payload.depthStr === undefined) {
            TreeUtil.traverse(hierarchyTree, (node, childIndex) => {
                let parentDepth = [] 
                if (node.parent) {
                    parentDepth = node.parent.payload.depthLst || []
                }
                let {global, local} = node.payload.zOrders
                let area = node.payload.size[0] * node.payload.size[1]
                let depthLst = parentDepth.concat([global, 1 - area, local, childIndex])
                node.payload.depthLst = depthLst
            })
        }
        
        // expand to level 3
        TreeUtil.expand(hierarchyTree, 3)

        this.setState({
            hierarchyTree,
            hierarchyTreeNodeMap,  
            hierarchyCursor: null,
        })
    }

    toggleShowInvisibileNode() {
        this.setState({hierarchyShowInvisibleNode: !this.state.hierarchyShowInvisibleNode})
    }
    handleMainSplitPaneResized(size) {
        this.setState({elementPaneWidth: size})
    }
    handleRefreshRequest() {
        this.ref_elementPane.setState({refreshing: true, screen: ''})
        this.props.onRefreshRequest(this.state.elementPaneWidth)
    }
    handlePasteHierarchyRequest() {
        this.setState({showPastePanel: true})
    }
    handlePasteHierarchy() {
        if (this.state.rawHierarchyPasted) {
            try {
                let tree = JSON.parse(this.state.rawHierarchyPasted)
                this.handleHierarchyUpdate(tree)
                this.setState({showPastePanel: false, rawHierarchyPasted: ''})
            } catch (e) {
                $.toaster({message: e.message, title: 'Err', priority: 'warning'})
                console.error('手工输入json出错。检查下面')
                console.error(e)
            }
        }

        // for screen
        if (this.state.rawScreenPasted) {
            this.setState({showPastePanel: false, screen: `data:image/${this.state.rawScreenFormatPasted};base64,${this.state.rawScreenPasted}`, rawScreenPasted: ''})
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.hierarchyTree) {
            this.handleHierarchyUpdate(nextProps.hierarchyTree)
        }
        if (nextProps.screen && nextProps.screen !== this.state.screen) {
            this.setState({screen: nextProps.screen})
        }

        // reset elementPaneWidth to default width when screen rotation changed
        if (nextProps.screenHeight !== this.props.screenHeight || nextProps.screenWidth !== this.props.screenWidth) {
            if (nextProps.screenHeight > nextProps.screenWidth) {
                this.setState({elementPaneWidth: 405})
            } else {
                this.setState({elementPaneWidth: 720})
            }
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
        let screen = this.state.screen

        // hierarchy tree filter: search/conditions
        let tree = this.state.hierarchyTree
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
        const elementPane = <ElementPane ref={r => this.ref_elementPane = r} parent={this} elementSelecting={this.state.elementSelecting} hierarchyCursor={cursor} hierarchyTree={tree} 
                                screen={screen} screenWidth={this.props.screenWidth} screenHeight={this.props.screenHeight} screenFlipX={this.props.screenFlipX} 
                                paneWidth={this.state.elementPaneWidth} paneHeight={this.state.elementPaneWidth * this.props.screenHeight / this.props.screenWidth} />
        const attributePane = <div ref={r => this.ref_attributePane = r}> 
            {!!cursor && <div style={{padding: '3px'}}>
                <div style={{marginTop: '3px'}}>
                    <ObjectInspector theme="chromeDark" data={cursor.payload} name={cursor.name} expandLevel={1} />
                </div>
            </div>}
        </div>
        return <div>
            <div style={{height: '25px', padding: '2px 10px'}}>
                {this.props.customToolbar}
                {toolBarButton('mdi-navigation-refresh', '刷新', this.handleRefreshRequest)}
                {toolBarButton('content_paste', '手动输入hierarchy', this.handlePasteHierarchyRequest)}
                {false && toolBarButton(this.state.hierarchyShowInvisibleNode ? 'mdi-action-visibility': 'mdi-action-visibility-off', '显示invisible节点', this.toggleShowInvisibileNode, this.state.hierarchyShowInvisibleNode ? 'color-primary' : '-')}
            </div>
            <div style={{position: 'absolute', top: '25px', right: 0, bottom: 0, left: 0}}>
                {function () {
                    if (this.props.screenHeight > this.props.screenWidth) {
                        return <SplitPane split='vertical' defaultSize={405} onChange={this.handleMainSplitPaneResized} pane1Style={{overflow: 'hidden'}} pane2Style={{overflow: 'auto'}} >
                                {elementPane}
                            <SplitPane split='vertical' defaultSize={450}>
                                {hierarchyPane}
                                {attributePane}
                            </SplitPane>
                        </SplitPane>
                    } else {
                        return <SplitPane split='vertical' defaultSize={720} onChange={this.handleMainSplitPaneResized} >
                            <SplitPane split='horizontal' defaultSize={405} pane1Style={{overflow: 'hidden'}} pane2Style={{overflow: 'auto'}} >
                                {elementPane}
                                {attributePane}
                            </SplitPane>
                            {hierarchyPane}
                        </SplitPane>
                    }
                }.bind(this) ()}
            </div>
            <PopoverModal backdrop show={this.state.showPastePanel} onCancel={() => this.setState({showPastePanel: false})} onConfirm={this.handlePasteHierarchy} >
                <div>Paste hierarchy json string below.</div>
                <textarea className='form-control' rows={6} valueLink={linkState(this, 'rawHierarchyPasted')} placeholder='hierarchy' />
                <textarea className='form-control' rows={6} valueLink={linkState(this, 'rawScreenPasted')} placeholder='b64 encoded screen' />
                <textarea className='form-control' rows={1} valueLink={linkState(this, 'rawScreenFormatPasted')} placeholder='png/jpg/etc.' />
            </PopoverModal>
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

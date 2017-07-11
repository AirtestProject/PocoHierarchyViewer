
var React = require('react');
const {Range} = ace.require('ace/range')
const {HoverLink} = ace.require('ace/mode/hoverlink')


// 在这里加入还需要支持语言
var langToMode = lang => {
    const LangMap = {
        js: 'javascript',
        nodejs: 'javascript',
        raw: 'text',
        python: 'python',
        lua: 'lua',
        log: 'log', 
        lpc: 'lpc',
        csharp: 'csharp',
        'c#': 'csharp',
        cs: 'csharp',
    }
    let mode = LangMap[lang] || 'text' 
    return 'ace/mode/' + mode
}

class AceEditor extends React.Component {
    constructor(props) {
        super(props)
        this.aceObject = null
        this.highLightMarker = null
    }
    componentDidMount() {
        let defaultValue = this.props.value || ''
        this.aceObject = ace.edit('AceDisp-' + this.props.uid);
        this.aceObject.getSession().setMode(langToMode(this.props.lang))
        this.aceObject.setTheme('ace/theme/monokai');
        this.aceObject.setShowPrintMargin(false);
        this.aceObject.setValue(this.props.valueLink ? this.props.valueLink.value : defaultValue);
        this.aceObject.resize(true);  // force to wait ace ready 
        if (this.props.valueLink) {
            this.aceObject.getSession().on("change", () => {
                // ace 编辑器中的数据改变了，通知外层的link state
                this.props.valueLink.requestChange(this.aceObject.getValue());
            });
        }

        if (this.props.readOnly) {
            this.aceObject.setReadOnly(true);
        }

        // restore line and selection 
        if (this.props.midLineNumLink && this.props.midLineNumLink.value) {
            this.aceObject.$blockScrolling = Infinity;
            this.aceObject.scrollToLine(this.props.midLineNumLink.value, true, false, function() {});
        } else {
            this.aceObject.gotoLine(0, 0, true);
        }

        if (this.props.selectionLink && this.props.selectionLink.value) {
            this.aceObject.selection.setRange(this.props.selectionLink.value);
        }

        if (this.props.tag) {
            this.props.parent.aceSlots = this.props.parent.aceSlots || {};
            this.props.parent.aceSlots[this.props.tag] = this;
        } else {
            if (this.props.parent) {
                this.props.parent.aceEditor = this;
            }
        }
        
        if (this.props.options) {
            for (let item in this.props.options) {
                let val = this.props.options[item]
                this.aceObject.setOption(item, val)
            }
        }

        // hover link options
        let pattern = null
        let tipsWord = ''
        let requireCtrlKey = false 
        if (this.props.lang === 'log') {
            pattern = /(https?|HunterInstruction):(\/\/|##)[^\s"':]+/g
            tipsWord = '转到定义'
        } else if (this.props.lang === 'python') {
            pattern = /(require\s*\(\s*u?['"][^'"]+['"]\s*\))|(ICALL\s*\[\s*['"][^'"]+['"]\s*\])/
            tipsWord = '按ctrl转到定义'
            requireCtrlKey = true
        } else if (this.props.lang === 'lua' || this.props.lang === 'js') {
            pattern = /(hunter\.require\s*\(?\s*['"][^'"]+['"][ ]*\)?)|(ICALL\s*\[\s*['"][^'"]+['"]\s*\])/
            tipsWord = '按ctrl转到定义'
            requireCtrlKey = true
        }
        if (pattern) {
            this.aceObject.hoverLink = new HoverLink(this.aceObject, pattern, tipsWord, {requireCtrlKey})
            this.aceObject.hoverLink.on("open", evt => {
                if (this.props.onLinkOpened) {
                    this.props.onLinkOpened(evt)
                } 

                // default handler 
                console.log(evt)
            })
        }

        // auto complete options
        if (!this.props.readOnly) {
            let langTools = ace.require("ace/ext/language_tools")
            this.aceObject.setOptions({
                enableBasicAutocompletion: true,
                enableSnippets: true,
                enableLiveAutocompletion: true,
            })
        }
    }
    componentWillUnmount() {
        if (this.props.tag) {
            delete this.props.parent.aceSlots[this.props.tag];
        } else {
            if (this.props.parent) {
                this.props.parent.aceEditor = null;
            }
        }

        // store line number
        if (this.props.midLineNumLink) {
            var scrollBottomLineNum = this.aceObject.renderer.getScrollBottomRow();
            var scrollTopLineNum = this.aceObject.renderer.getScrollTopRow();
            this.props.midLineNumLink.requestChange((scrollBottomLineNum + scrollTopLineNum) / 2);
        }    

        // store selection
        if (this.props.selectionLink) {
            var currentSelectionRange = this.aceObject.getSelectionRange();
            this.props.selectionLink.requestChange(currentSelectionRange);
        }
        if (this.aceObject.hoverLink) {
            this.aceObject.hoverLink.destroy()
        }
        this.aceObject.destroy()
    }    
    componentWillReceiveProps(nextProps) {
        const oldProps = this.props;
        if (nextProps.lang !== oldProps.lang) {
            this.aceObject.getSession().setMode(langToMode(nextProps.lang))
        }
        if (nextProps.fontSize !== oldProps.fontSize) {
            this.aceObject.setFontSize(nextProps.fontSize);
        }
        if (nextProps.readOnly !== oldProps.readOnly) {
            this.aceObject.setReadOnly(nextProps.readOnly);
        }
        if (nextProps.valueLink) {
            if (nextProps.valueLink.value !== this.aceObject.getValue()) {
                this.aceObject.setValue(nextProps.valueLink.value);
            }
        } else {
            if (nextProps.value !== undefined && nextProps.value != this.aceObject.getValue()) {
                this.aceObject.setValue(nextProps.value);
            }
        }
        if (nextProps.height !== oldProps.height) {
            $(this.refs.aceElement).css('height', nextProps.height + 'px');
            this.aceObject.resize(true);
        }
        if (nextProps.wrapMode !== oldProps.wrapMode) {
            this.aceObject.getSession().setUseWrapMode(nextProps.wrapMode)
        }
        if (nextProps.fontSize !== oldProps.fontSize) {
            this.aceObject.setFontSize(nextProps.fontSize)
        }
    }
    forceRerender() {
        this.aceObject.resize(true);
    }
    setHighLightLine(lineNumber) {
        let firstLineNumber = this.aceObject.getOption('firstLineNumber') || 0
        lineNumber -= firstLineNumber 
        let range = new Range(lineNumber, 0, lineNumber, 1)
        if (this.highLightMarker) {
            this.aceObject.getSession().removeMarker(this.highLightMarker)
        }
        this.highLightMarker = this.aceObject.getSession().addMarker(range, 'ace_line_highlight', 'fullLine', true) 
        this.aceObject.gotoLine(lineNumber, 0, false)
    }
    render() {
        var style = Object.assign({}, this.props.style)
        if (this.props.height && !style.height) {
            style.height = this.props.height
        } else {
            style = Object.assign({position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}, style)
        }
        return <div id={'AceDisp-' + this.props.uid} style={style} ref='aceElement' className={this.props.className}></div>;
    }
}

module.exports = AceEditor;


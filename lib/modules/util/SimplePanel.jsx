
var React = require('react')
import ResizableAndMovable from 'react-rnd'
import autoBind from 'react-autobind'

class SimplePanel extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            height: this.props.height 
        }
        autoBind(this)
    }
    handleOnResize(dir, size, clientSize, delta) {
        this.setState({height: clientSize.height})
        if (this.props.widthLink) {
            this.props.widthLink.requestChange(clientSize.width)
        }
        if (this.props.onResize) {
            this.props.onResize(dir, size, clientSize, delta)
        }
    }
    render() {
        var right = this.props.initRight || $(window).width() - 150;
        var left = null; 
        var top = null; 
        if (this.props.initRight) {
            left = this.props.initRight - $(window).width();
        } else {
            left = -150; 
        }
        if (this.props.initBottom) {
            top = $(window).height() - this.props.initBottom;
        } else {
            top = this.props.initTop || 50;
        }
        var style = Object.assign({position: 'absolute', top: top, right: right, display: this.props.showLink.value ? '' : 'none', width: 0, height: 0}, this.props.style);
        let initWidth = this.props.widthLink ? this.props.widthLink.value : (this.props.width || '-')
        return (
            <div style={style}>
                <ResizableAndMovable zIndex={1000} 
                    bounds={{top: -top, left: left, right: 2000, bottom: 2000}} 
                    initial={{x: 0, y: 0, height: this.props.height || 'auto', width: initWidth}}
                    minWidth={50}
                    minHeight={50}
                    maxWidth={this.props.maxWidth}
                    maxHeight={this.props.maxHeight}
                    dragHandlerClassName='.drag-handle' 
                    isResizable={this.props.isResizable || {left: true, right: true}}
                    onResize={this.handleOnResize}
                    >
                    <div className="float-panel">
                        <div className='drag-handle' style={{padding: '5px 0'}}>
                            <i className='material-icons panel-close-button' onClick={() => {this.props.showLink.requestChange(false);}}>remove_circle</i> 
                            <span className='panel-header-title text-primary not-selectable'>{this.props.title}</span>
                        </div>    
                        <div className='panel-content' style={this.props.height ? {height: this.state.height + 'px'} : {}}>
                            {this.props.children}
                        </div>
                    </div>    
                </ResizableAndMovable>    
            </div>
        );    
    }
}

module.exports = SimplePanel


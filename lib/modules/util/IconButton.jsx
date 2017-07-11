
var React = require('react');
import {OverlayTrigger, Overlay, Popover} from 'react-bootstrap'

class IconButton extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let tipsPanel = undefined 
        if (this.props.hint) {
            tipsPanel = (
                <Popover id={this.props.text + this.props.hint + '-id-'}>
                    {this.props.hint}
                </Popover>
            )
        } else {
            // empty overlay stub
            tipsPanel = <Overlay></Overlay>
        }
        var iconStyle = this.props.iconStyle || {};
        iconStyle.verticalAlign = iconStyle.verticalAlign || 'text-bottom';

        let enableState = this.props.disabled ? ' disabled' : ''
        return (
            <OverlayTrigger overlay={tipsPanel} placement={this.props.hintPlacement || 'top'}>
                <span className={this.props.className} style={this.props.style}>
                    <a onClick={this.props.onClick} href={this.props.href} className={(this.props.btnClass || 'btn btn-default btn-xs') + enableState} style={this.props.btnStyle || {margin: 0}}>
                        {this.props.icon && (this.props.icon.startsWith('mdi-') ? 
                            <i className={this.props.icon} style={iconStyle}></i> :
                            <i className='material-icons' style={iconStyle}>{this.props.icon}</i>
                        )}
                        <span style={{verticalAlign: 'text-bottom'}}>{this.props.children || this.props.text}</span>
                    </a>
                </span>
            </OverlayTrigger>
        )
    }
}

module.exports = IconButton


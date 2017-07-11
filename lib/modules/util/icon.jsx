
const _ = require('lodash')
const React = require('react')
import {OverlayTrigger, Popover} from 'react-bootstrap'

export class Icon extends React.Component {
    render() {
        let style = {verticalAlign: 'text-bottom'}
        if (this.props.size) {
            style.fontSize = this.props.size + 'px'
        }
        if (this.props.color) {
            style.color = this.props.color
        }
        if (this.props.hint) {
            let overlay = null
            if (_.isString(this.props.hint)) {
                overlay = <Popover id={Math.random() + ''}>{this.props.hint}</Popover>
            } else {
                overlay = this.props.hint
            }
            return <OverlayTrigger overlay={overlay} placement='right'>
                {this.props.icon.startsWith('mdi-') ? 
                    <i className={this.props.icon} style={style} onClick={this.props.onClick}></i> :
                    <i className='material-icons' style={style} onClick={this.props.onClick}>{this.props.icon}</i>
                }
            </OverlayTrigger>
        } else {
            return this.props.icon.startsWith('mdi-') ? 
                <i className={this.props.icon} style={style} onClick={this.props.onClick}></i> :
                <i className='material-icons' style={style} onClick={this.props.onClick}>{this.props.icon}</i>
        }
    }
}

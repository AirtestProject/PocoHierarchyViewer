
const React = require('react')
import autoBind from 'react-autobind'


class InputBase extends React.Component {
    constructor(props) {
        super(props)
        this.handleOnChange = this.handleOnChange.bind(this)
        this.focus = this.focus.bind(this)
        this.getValue = this.getValue.bind(this)
    }
    componentDidMount() {
        if (this.props.focused) {
            this.refs.inputControl.focus()
        }
    }
    handleOnChange(evt) {
        if (this.props.valueLink) {
            this.props.valueLink.requestChange(evt.target.value)
        }
    }
    focus() {
        this.refs.inputControl.focus()
    }
    getValue() {
        let value = this.props.valueLink ? this.props.valueLink.value : this.props.value
        return value || ""
    }
}

export class LinkedInput extends InputBase { 
    constructor(props) {
        super(props)
    }
    render() {
        let value = this.getValue() 
        return <input ref='inputControl' type={this.props.type || 'text'} value={value} onChange={this.handleOnChange} 
                    className={this.props.className || 'form-control'}
                    style={this.props.style} 
                    placeholder={this.props.placeholder} />
    }
}

export class LinkedTextarea extends InputBase { 
    constructor(props) {
        super(props)
    }
    render() {
        let value = this.getValue()
        return <textarea ref='inputControl' className={this.props.className || 'form-control'}
                    style={this.props.style}
                    placeholder={this.props.placeholder} 
                    rows={this.props.rows || 8} 
                    value={value}
                    onChange={this.handleOnChange}
                    >
        </textarea>
    }
}


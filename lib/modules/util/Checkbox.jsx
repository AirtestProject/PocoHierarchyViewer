
const React = require('react')
import autoBind from 'react-autobind'

class Checkbox extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            checked: Boolean(this.props.checkedLink.value),
        }
        autoBind(this)
    }
    componentDidMount() {
        $.material.checkbox()
    }
    handleOnChange(e) {
        this.props.checkedLink.requestChange(e.target.checked)
    }
    render() {
        let style = Object.assign({display: this.props.inline ? 'inline': 'block'}, this.props.style)
        return <div className="checkbox" style={style}>
            <label>
                <input disabled={this.props.readOnly} type="checkbox" onChange={this.handleOnChange} checked={this.props.checkedLink.value} /> {this.props.label}
            </label>
        </div>
    }
}

module.exports = Checkbox


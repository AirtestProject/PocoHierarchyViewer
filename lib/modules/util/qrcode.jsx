
var React = require('react')

class QRCode extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            value: this.props.value,
        }
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.value !== this.props.value) {
            this.setState({value: nextProps.value})
        }
    }
    componentDidUpdate() {
        $(this.refs.qrcodeDisp).empty().qrcode({
            text: this.state.value,
            size: this.props.width,
        })
    }
    componentDidMount() {
        this.forceUpdate()
    }
    render() {
        var outerWidth = this.props.width + 40
        return <div style={{width: outerWidth + 'px'}}>
            <div className='panel panel-default'>
                <div className='panel-body' style={{backgroundColor: '#DDD', padding: '20px'}}>
                    <div ref='qrcodeDisp'></div>
                </div>
            </div>    
        </div>
    }
}

module.exports = QRCode



var React = require('react'); 
var ReactBootstrap = require('react-bootstrap'); 
var Modal = ReactBootstrap.Modal;

class MessageModal extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Modal show={true} onHide={this.props.onClose} backdrop={false}>
                <div style={{marginTop: '120px'}}>
                    <Modal.Header>
                        <Modal.Title>{this.props.title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {this.props.children}
                        <div>
                            <a className='btn btn-success' onClick={this.props.onClose}>{this.props.confirm || '确认'}</a> 
                        </div>
                    </Modal.Body>
                </div>
            </Modal>
        );
    }
}

module.exports = MessageModal;


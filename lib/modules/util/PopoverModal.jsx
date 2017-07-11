
var React = require('react'); 
var ReactBootstrap = require('react-bootstrap'); 
var Modal = ReactBootstrap.Modal;

class PopoverModal extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Modal show={this.props.show} onHide={this.props.onCancel} backdrop={this.props.backdrop || false}>
                <div style={{marginTop: '120px'}}>
                    <Modal.Header>
                        <Modal.Title>{this.props.title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {this.props.children}
                        <div>
                            {(this.props.onConfirm || !this.props.onCancel) && <a className='btn btn-success' onClick={this.props.onConfirm}>{this.props.confirm || '确认'}</a>}
                            {!!this.props.onCancel && <a className='btn btn-default' onClick={this.props.onCancel}>{this.props.cancel || '取消'}</a>} 
                        </div>
                    </Modal.Body>
                </div>
            </Modal>
        );
    }
}

module.exports = PopoverModal;


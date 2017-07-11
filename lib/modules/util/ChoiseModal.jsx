
var React = require('react'); 
var ReactBootstrap = require('react-bootstrap'); 
var Modal = ReactBootstrap.Modal;

class ChoiseModal extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <Modal show={this.props.show} onHide={this.props.onCancel}>
                <div style={{marginTop: '120px'}}>
                    <Modal.Header>
                        <Modal.Title>{this.props.title || '那么，现在...'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>{this.props.tips}</p>
                        {this.props.children}
                    </Modal.Body>
                </div>
            </Modal>
        );
    }
}

module.exports = ChoiseModal;


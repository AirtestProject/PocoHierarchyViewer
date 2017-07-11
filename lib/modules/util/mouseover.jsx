
var React = require('react');


class MouseOverComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            mouseover: false,
        };
        this.superState = this.superState.bind(this);
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
    }
    superState() {
        return this.state;
    }
    handleMouseEnter() {
        this.setState({mouseover: true});
    }
    handleMouseLeave() {
        this.setState({mouseover: false});
    }
}

module.exports = MouseOverComponent;


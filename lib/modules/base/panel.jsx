
const React = require('react')
const MouseOverComponent = require('../util/mouseover')

export class Panel extends MouseOverComponent {
    constructor(props) {
        super(props)
        this._firstShown = false
    }

    onFirstShown() {
        // override
    }
    onShown() {
        // override
    }
    onWillHide() {
        // override
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.showLink.value === true && this.props.showLink.value === false) {
            if (!this._firstShown) {
                this._firstShown = true
                this.onFirstShown()
            }
            this.onShown()
        } else if (nextProps.showLink.value === false && this.props.showLink.value === true) {
            this.onWillHide()
        }
    }
}

Panel.propTypes = {
    showLink: React.PropTypes.object, 
}


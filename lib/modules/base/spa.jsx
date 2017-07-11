
const React = require('react')

export class SPAContainer extends React.Component {
    render() {
        return <div style={{position: 'absolute', top: 50, left: 0, right: 0, bottom: 0}}>
            {this.props.children}
        </div>
    }
}


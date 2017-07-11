
var React = require('react');


class ProgressBar extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        var percent = this.props.percent || 0;
        var max = this.props.max || 100;
        var height = this.props.height || 20;
        var progressBarTypeMapping = {
            red: 'warning',
            blue: 'info',
            green: 'success',
        };
        var progressBarType = progressBarTypeMapping[this.props.color] || 'info';
        return <div className="progress progress-striped active" style={{height: height + 'px'}}>
            <div className={'progress-bar progress-bar-' + progressBarType} style={{width: (percent / max * 100) + '%'}}></div>
            <div style={{position: 'absolute', width: '92%', textAlign: 'center', fontWeight: 'bold'}}>{percent.toFixed(1)}</div>
        </div>
    }
}


class ProgressBarFloat extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        var percent = this.props.percent || 0;
        var max = this.props.max || 100;
        var height = this.props.height || 20;
        var progressBarTypeMapping = {
            red: 'warning',
            blue: 'info',
            green: 'success',
        };
        var progressBarType = progressBarTypeMapping[this.props.color] || 'info';
        return <div className="progress progress-striped active" style={{height: 0, width: 0}}>
            <div className={'progress-bar progress-bar-' + progressBarType} style={Object.assign({height: height + 'px', width: (percent * this.props.width / max) + 'px', position: 'absolute', opacity: 0.4}, this.props.style)}></div>
        </div>
    }
}

module.exports = {ProgressBar: ProgressBar, ProgressBarFloat: ProgressBarFloat};


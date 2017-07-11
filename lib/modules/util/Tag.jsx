
var React = require('react');

class ColorTag extends React.Component {
    constructor() {
        super();
    }
    render() {
        var tags = $.map(this.props.tags, (val, i) => {
            return <span key={'tag' + i} className={val.color + '-tag'}>{val.content || val.value}</span>;
        });
        return (
            <span>
                {tags}
            </span>
        );
    }
}

module.exports = ColorTag;


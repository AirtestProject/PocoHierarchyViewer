
var _ = require('lodash')
var React = require('react');

var defaultSuggestionTemplate = data => {
    return `<div>${data}</div>`
}

class TypeaheadInput extends React.Component {
    constructor(props) {
        super(props);
        this.handleTypeaheadEvents = this.handleTypeaheadEvents.bind(this);
        this.handleTypeaheadEvents_autocomplete = this.handleTypeaheadEvents_autocomplete.bind(this);
        this.focus = this.focus.bind(this);
        this.showSuggestion = this.showSuggestion.bind(this);
        this.forceSetInput = this.forceSetInput.bind(this);
        this.handleInputIdle = this.handleInputIdle.bind(this);
    }
    handleTypeaheadEvents(evt, suggestion) {
        suggestion = (this.props.toValue || _.identity)(suggestion)
        this.props.valueLink.requestChange(suggestion);
    }
    handleTypeaheadEvents_autocomplete(evt, suggestion) {
        suggestion = (this.props.toValue || _.identity)(suggestion)
        if (this.props.valueLink.value.length < suggestion.length) {
            this.props.valueLink.requestChange(suggestion);
        } else {
            this.forceSetInput(this.props.valueLink.value);
        }
    }
    handleInputIdle() {
        if (!this.props.valueLink.value) {
            this.forceSetInput('');
        }
    }
    focus() {
        $(this.refs.singleLineInput).focus();
    }
    showSuggestion(enable=true) {
        $(this.refs.singleLineInput).typeahead(enable ? 'open' : 'close');
    }
    forceSetInput(val) {
        $(this.refs.singleLineInput).typeahead('val', val);
    }

    componentDidMount() {
        // typeahead 插件
        let suggestionLimit = this.props.suggestionLimit || 15
        let typeahead = $(this.refs.singleLineInput)
        typeahead.typeahead({
            hint: true,
            highlight: true,
            minLength: 1,
        },
        {
            name: this.props.name || 'typeahead-dft',
            limit: this.props.suggestionLimit || 15,
            display: this.props.display || _.identity, 
            source: this.props.matcher,
            templates: {
                suggestion: this.props.suggestionTemplate || defaultSuggestionTemplate,
            },
        });

        typeahead.bind('typeahead:change', this.handleTypeaheadEvents); 
        typeahead.bind('typeahead:select', this.handleTypeaheadEvents); 
        typeahead.bind('typeahead:autocomplete', this.handleTypeaheadEvents_autocomplete);
        typeahead.bind('typeahead:idle', this.handleInputIdle);
        typeahead.focus();
        if (this.props.parent) {
            this.props.parent.typeaheadInputer = this;
        }
    }
    componentWillUnmount() {
        let typeahead = $(this.refs.singleLineInput)
        if (this.props.parent) {
            this.props.parent.typeaheadInputer = null;
        }
        typeahead.unbind('typeahead:change', this.handleTypeaheadEvents); 
        typeahead.unbind('typeahead:select', this.handleTypeaheadEvents); 
        typeahead.unbind('typeahead:autocomplete', this.handleTypeaheadEvents_autocomplete);
        typeahead.unbind('typeahead:idle', this.handleInputIdle);
        typeahead.typeahead('destroy')
    }
    render() {
        return <input ref='singleLineInput' type='text' valueLink={this.props.valueLink} placeholder={this.props.placeholder || ''} className='form-control typeahead' />
    }
}

module.exports = TypeaheadInput;


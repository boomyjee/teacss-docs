Liquid.Template.registerTag('extends', Liquid.Block.extend({
    template_name: false,
    blocks: false,
    tagSyntax: /((?:"[^"]+"|'[^']+'|[^\s,|]+)+)/,
    
    init: function (tag,markup,tokens) {
        
        var matches = markup.match(this.tagSyntax);
        if (matches) {
            this.template_name = matches[1];
        }
        else {
            throw "Syntax Error in 'extends' - Valid syntax: extends [template]";
        }        
        
        this._super(tag,markup,tokens);
    
        this.blocks = {};
        for (var i=0;i<this.nodelist.length;i++) {
            var node = this.nodelist[i];
            if (node instanceof Liquid.Template.tags.block) this.blocks[node.name] = node;
        }
    },
    
    render: function (context) {
        var template = this.load_template(context);
        
        var parent_blocks = {};
        this.find_blocks(template.root,parent_blocks);
            
        for (var name in this.blocks) {
            var block = this.blocks[name];
            var pb;
            if (pb = parent_blocks[name]) {
                pb.parent = block.parent;
                pb.add_parent(pb.nodelist);
                pb.nodelist = block.nodelist;
            } else {
                if (this.is_extending(template))
                    template.root.nodelist.push(block);
            }
        }
        var output = template.render(context);
        output = [output].flatten().join('');
        return output;
    },
    
    assertMissingDelimitation: function() {
        return;
    },
    
    load_template : function(context) {
        var source = Liquid.readTemplateFile(context.get(this.template_name));
        var template = new Liquid.Template();
        template.parse(source);
        return template;
    },
    
    find_blocks: function(node,blocks) {
        if (node.nodelist) {
            for (var i=0;i<node.nodelist.length;i++) {
                var sub = node.nodelist[i];
                if (sub instanceof Liquid.Template.tags.block) blocks[sub.name] = sub;
                this.find_blocks(sub,blocks);
            }
        }
    },
    
    is_extending: function(template) {
        for (var i=0;i<template.root.nodelist.length;i++) {
            var node = template.root.nodelist[i];
            if (node instanceof Liquid.Template.tags.extends) return true;
        }
        return false;
    }
}));

Liquid.Template.registerTag('block', Liquid.Block.extend({
    tagSyntax: /(\w+)/,
    init: function(tagName, markup, tokens) {
        var parts = markup.match(this.tagSyntax)
        if( parts ) {
            this.name = parts[1];
        } else {
            throw ("Syntax error in 'block' - Valid syntax: block [name]");
        }
        if (tokens)
            this._super(tagName, markup, tokens);
    },    
    render: function (context) {
        var output = this.renderAll(this.nodelist,context);
        output = [output].flatten().join('');
        return output;
    },
    add_parent: function (nodelist) {
        if (this.parent) {
            this.parent.add_parent(nodelist);
        } else {
            this.parent = new Liquid.Template.tags.block('block',this.name,false);
        }
    }
}));
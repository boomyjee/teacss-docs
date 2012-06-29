if (window.Liquid) window.Liquid.readTemplateFile = function(path) {
    var list = teacss.tea.Template.templates;
    if (list[path]) return list[path].text;
    throw ("No such Template: "+path);
}

teacss.tea.Fixture = teacss.Scope.extend({
    run: function (sel,f) {
        this.current = {};
        f.call(this);
        
        var parts = sel.replace(/Fixture\s*/,'').split(":",2);
        var tpl = teacss.trim(parts[0]);
        
        if (parts.length<2) {
            var fix = "default";
        } else {
            var fix = teacss.trim(parts[1]);
        }
        
        if (!teacss.tea.Template.templates[tpl]) return;
        teacss.tea.Template.templates[tpl].fixtures[fix] = this.current;
    },
    rule: function (key,val) {
        if (val && val.call && val.apply) {
            var top = this.current;
            this.current = {};
            val.call(this);
            
            if (key!="")
                top[key] = this.current;
            else {
                if (top.constructor != Array) top = [];
                top.push(this.current);
            }
            this.current = top;
        } else {
            this.current[key] = val;
        }
    },
    format: "js"
});

teacss.tea.Template = teacss.Scope.extend({
    templates: {},
    styleMark: "<!-- TEA STYLE -->",
    scriptMark: "<!-- TEA SCRIPT name -->",
    
    run: function (name,f) {
        var me = this;
        name = name.replace(/^\s*Template\s*/,'');
        
        this.output = "";
        
        var old_Style = teacss.tea.Style;
        var old_Script = teacss.tea.Script;

        teacss.tea.Style = {init:function(){ me.output += me.styleMark; }}
        teacss.tea.Script = {init:function(name){ 
            name = name.replace(/^Script\s*/,'');
            me.output += me.scriptMark.replace("name",name); 
        }}
            
        if (!f) throw "Template has to be block tag";
        f.call(this);

        teacss.tea.Style = old_Style;
        teacss.tea.Script = old_Script;
        
        if (this.ifTag) this.output += "{% endif %}";
        
        var text = this.output;
        if (name=='') return text;
        
        if (window.Liquid) {
            var tpl = new Liquid.Template();
            tpl.rethrowErrors = true;
            tpl.parse(text);
        } else {
            var tpl = false;
        }
        
        this.templates[name] = {
            liquid: tpl,
            text: text,
            fixtures: {}
        };
    },
    
    preview: function (name,data) {
        var t = this.templates[name];
        if (!t) return;
        
        if (!t.liquid) {
            var text = t.text;
        } else {
            var text = t.liquid.render(data);
        }
        
        
        var i;
        if ((i = text.indexOf("<body>"))!=-1) text = text.substring(i+6);
        if ((i = text.lastIndexOf("</body>"))!=-1) text = text.substring(0,i);
        
        var body = document.getElementsByTagName("body")[0];
        body.innerHTML = text;
    },
    
    rule: function (key,f) {
        var is_block = false;
        if (f && f.call && f.apply) 
            is_block = true;
        else if (f) key = key + f;
        
        // liquid tag
        if (key[0]=='%' && key[1]!='[') {
            this.output += "{"+key+" %}";
            if (is_block) {
                f.call(this);
                var tag = teacss.trim(key.substring(1)).split(" ",1)[0];
                
                if (this.ifTag && tag!="else")
                    this.output += "{% endif %}";
                this.ifTag = false;
                
                if (tag=="else") 
                    this.output += "{% endif %}";
                else if (tag=="if") {
                    this.ifTag = true;
                } 
                else {
                    this.output += "{% end"+tag+" %}";
                }
            }
            return;
        }        
        this.ifTag = false;
        
        // html tag or plain text
        var tag_re = /^(html|head|body|title|div|ul|li|b|strong|i|font|a|h1|h2|h3|h4|h5|h6|script|style|form|input|button|label|p|span|section|table|tr|td|meta|ol|link)/;
        var tag_single = /^(input|br|link)$/;
        
        var atts = {'class':[]};
        var sel = key;
        var tag = false;
        var match;        
        
        while (true) {
            if (sel[0]=="#") {
                var id = sel.match(/#[A-Za-z0-9-_]*/)[0];
                if (id.length>1) atts.id = '"'+id.substring(1)+'"';
                sel = sel.substring(id.length);
                if (!tag) tag = "div";
            }
            else if (sel[0]==".") {
                var cls = sel.match(/\.[A-Za-z0-9-_]*/)[0];
                if (cls.length>1) atts['class'].push(cls.substring(1));
                sel = sel.substring(cls.length);
                if (!tag) tag = "div";
            }
            else if (!tag && tag_re.test(sel)) {
                var t = sel.match(/[A-Za-z0-9-_]*/)[0];
                tag =  (t && t.length) ? t : "div";
                sel = sel.substring(t.length);
            }
            else if (match = sel.match(/^\[([A-Za-z0-9-_]+)\s*=\s*(((%\[.*?\])|.)*?)\]/)) {
                atts[match[1]] = match[2];
                sel = sel.substring(match[0].length);
                if (!tag) tag = "div";
            } else {
                break;
            }
        }
        sel = sel.replace(/^\s+/,'');
        
        if (!atts['class'].length) 
            delete atts['class'];
        else
            atts['class'] = '"'+atts['class'].join(" ")+'"';
        
        sel = sel.replace(/%\[(.*?)\]/g,"{{$1}}");
        
        if (tag) {
            if (tag=="html") this.output += "<!DOCTYPE html>";
            this.output += "<"+tag;
            for (var key in atts) {
                var val = atts[key];
                val = val.replace(/%\[(.*?)\]/g,"{{$1}}");
                this.output += " "+key+"="+val;
            }
            this.output += ">" + sel;
        } else {
            this.output += sel;
        }        
        
        if (is_block) {
            var prev = false;
            f.call(this);
        }
        if (tag && !tag_single.test(tag)) this.output += "</"+tag+">";        
    }
});
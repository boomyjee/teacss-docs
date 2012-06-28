teacss.tea.Highlight = teacss.Scope.extend({
    getJS: function (ast) {
        var lang = teacss.trim(ast.selector.replace(/^Highlight\s*/,''));
        
        var s = "";
        for (var i=0;i<ast.children.length;i++) s += ast.children[i].flatten();

        var lines = s.split("\n");
        var min = 1000;
        for (var i=0;i<lines.length;i++) {
            var line = lines[i];
            var indent = line.match(/^\s*/);
            indent = indent ? indent[0].length : 0;
            if (indent==line.length) continue;
            if (indent < min) min = indent;
        }
        var indent = new Array(min+1).join(" ");
        
        var s = "";
        var i = 0;
        var pre = "";
        if (lines.length && lines[0].length==0) {
            pre = "\n";
            i = 1;
        }
        
        for (;i<lines.length;i++) {
            
            line = lines[i].substring(min).replace(/(["\\])/g,'\\$1');
            s += indent+'"'+line;
            s += (i==lines.length-1) ? '"' : '\\n"'+"+\n";
        }
        return "tea.Highlight.init('"+lang+"',"+pre+s+");";
    },
    run: function (lang,s) {
        function escapeHtml(str){
          return str
            .replace(/&/g, '&amp;')
            .replace(/>/g, '&gt;')
            .replace(/</g, '&lt;')
            .replace(/"/g, '&quot;');            
        } 
        
        var res = [];
        CodeMirror.runMode(s,lang,function(text,cls){
            if (res.length==0 || res[res.length-1].cls!=cls) {
                res.push({text:text,cls:cls});
            } else {
                res[res.length-1].text += text;
            }
        });
        
        var text = "";
        for (var i=0;i<res.length;i++) {
            var cls = res[i].cls ? " class='cm-"+res[i].cls+"'" : "";
            text += "<span"+cls+">"+escapeHtml(res[i].text)+"</span>";
        }
        
        teacss.tea.Template.output += "<pre class='cm-s-default'>"+text+"</pre>";
    }
    
});
<!doctype html>
<html>
<head>
    <title>Build docs</title>
    <link tea="make.tea">
    <script src="//code.jquery.com/jquery-1.7.2.js"></script>
    <script src="../assets/teacss/teacss.js"></script>
    <script>
        teacss.buildCallback = function (files) {
            var pages = ['index','canvas','stripes','build','template'];
            var html = {};
            for (var i=0;i<pages.length;i++) {
                var page = pages[i];
                var path = page+".htm";
                html[page] = teacss.tea.Template.templates[page]
                    .liquid.render({path:path})
                    .replace(
                        teacss.tea.Template.styleMark,
                        "<link rel='stylesheet' type='text/css' href='assets/style.css'>"
                    );
            }
            $.post(location.href,{html:html,css:files['/default.css']},function(){
                alert('Success!');
            });
        }
    </script>
    <?
        if (isset($_POST['html'])) {
            foreach ($_POST['html'] as $page=>$html)
                file_put_contents("../$page.htm",$html);
            file_put_contents("../assets/style.css",$_POST['css']);
        }
    ?>
</head>
<body>
    <h1>Build page for teacss-docs</h1>
</body>
</html>
$(function() {
    var udpatePreview = function() {
        var command = $("#command");
        var preview = $("#preview");
        var source = $("#source");
        
        preview.html(source.val());
        
        try {
            var result = document.evaluate(
                command.val(),
                preview.get(0),
                null,
                7,
                null
            );
            
            $("#count").text("found " + result.snapshotLength + " items").css("color", "blue");
            for(var i = 0; i < result.snapshotLength; i++) {
                result.snapshotItem(i).style.border = "1px dashed #00f";
            }
        }
        catch(e) {
            $("#count").text(e).css("color", "red");
        }
    };
    udpatePreview();
    
    window.setInterval(function() {
        var prevCommand = null;
        var prevSource = null;
        return function() {
            var command = $("#command").val();
            if(prevCommand !== command) {
                udpatePreview(command);
                console.info("command");
            }
            prevCommand = command;
            
            var source = $("#source").val();
            if(prevSource !== source) {
                console.info("source");
                udpatePreview(source);
            }
            prevSource = source;
        };
    }(), 100);
});
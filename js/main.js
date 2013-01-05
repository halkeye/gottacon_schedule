jQuery(document).ready(function() {
    jQuery.getJSON('data/schedule.json', function(data) {
        data = data.sheets[0];
        jQuery('title').text(data.title);

        var content = jQuery('<table>');
        var header = jQuery('<tr>').appendTo(jQuery('<thead>').appendTo(content));
        jQuery.each(data.data.splice(0,1)[0], function(col, colData) {
            if (col == 7) return true; /* Addition Date */
            header.append(
                jQuery('<th>').text(colData)
            );
            
        });
        var body = jQuery('<tbody>').appendTo(content);
        jQuery.each(data.data, function(row, rowData) {
            var tr = jQuery('<tr>');
            if (rowData[0] === null) return true;
            jQuery.each(rowData, function(col, colData) {
                if (col == 7) return true; /* Addition Date */
                tr.append(
                    jQuery('<td>').text(colData)
                );
            });
            tr.appendTo(body);
        });
        
        console.log(data);

        // last thing incase of error
        jQuery('#content').empty().append(content);
    });
});

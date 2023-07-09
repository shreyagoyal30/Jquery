document.addEventListener("DOMContentLoaded", () => {
 getData();
});
console.log("running");
function getData() {
    console.log("Data loading");
    var tr = "";
    tr += ` <div id="btnAddRow">
    <button id="add" type="button">Add New Row </button> 
    <a href="Next.aspx">Next Page</a>
    <table id="tbUser"  style="width:50%">
        <tr>
        <th>Name</th><th>Location</th><th></th>
    </tr>
    <tr>
        <td>Shreya   </td><td>Kota</td>
        <td><button class="btnDelete ">Delete</button></td>
    </tr>
</table > 
</div>`
    $("#main").html(tr);
}
$(document).ready(function () {
    $("#add").click(function () {
        $("#tbUser").append(`<tr>
        <td>Shreya <br>   </td><td>Kota</td>
        <td><button class="btnDelete">Delete</button></td>
    </tr>`);
    });
    $("#tbUser").on('click', '.btnDelete', function () {
        $(this).closest('tr').remove();
        alert("Deleted Successfully!!");
    });
}); 

$(document).ready(function () {
    $("p").click(function () {
        alert("The paragraph was clicked.");
    });
});

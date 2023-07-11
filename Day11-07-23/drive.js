document.addEventListener("DOMContentLoaded", () => {
    console.log("Yes");
    if (_cPath == "/settings/BASDrive/external/manageusers.aspx" || _cPath == "/settings/BASDrive/external/manageusers") {
        GetBasDriveExtraDriveMemberList();
    }
    else {
        GetBasDriveExtraDriveList();
    }
});

function GetBasDriveExtraDriveMemberList() {
    var param = {
        "userKey": $("#common_aKey").val(),
        "deviceInfo": device,
        "driveKey": $("#drivekey").val()
    }
    getCommonData("BascrmBasdrive/GetBasDriveExtraDriveMemberList", param, "new", function (result) {
        if (result.status) {
            console.log(result);
            var extraDriveMemberList = result.extraDriveMemberList;
            var length = extraDriveMemberList.length;
            var tr = "";
            if (length > 0) {
                tr = ` <div class="col-lg-12">
                            <h4>Manage users</h4>
                            <table class="table table-hover _table_alt fs--1">
                                <thead class="bg-soft-dark">
                                    <tr>
                                        <th width="15%">Name</th>
                                        <th width="20%">E-mail</th>
                                        <th width="10%">Assigned on</th>
                                        <th width="20%">Usage</th>
                                        <th width="35%"></th>
                                    </tr>
                                </thead>
                                <tbody>`;
                $.each(extraDriveMemberList, function (i, member) {
                    tr += ` <tr >
                                        <td>`+ member.name + `</td>
                                        <td>`+ member.email + `</td>
                                        <td>`+ member.dt + `</td>
                                        <td>
                                            <p class="mb-1 fw-bold">12GB used of 150 GB</p>
                                            <div class="progress mb-3 bg-soft-primary" style="height:15px">
                                                <div class="progress-bar bg-success" role="progressbar" style="width: 30%" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                                            </div>
                                        </td>
                                        <td class="text-end">
                                        <div class="">
                                        
                                        <input type="hidden" id="memberkey" name="data" value="`+ member.memberKey + `" runat="server"/>
                                        <a href="javascript:void(0)" class="btn btn-secondary btn-sm _driveAccessFiles">Files</a>
                                        <a href="javascript:void(0)"  class="btn btn-secondary btn-sm _deactiveAccess">Deactivate</a>
                                        <a href="javascript:void(0)"  class="btn btn-secondary btn-sm _driveBackup">Backup</a> 
                                        <a href="javascript:void(0)"  class="btn btn-secondary btn-sm danger _driveRemoveUser">Remove user</a>
                                        </div>
                                        </td>
                                    </tr>`;
                })
                tr += ` </tbody>
                            </table>
                        </div>`;
            }
            else {
                tr += `<h2>No Users found!</h2>`
            }
            $("#manageusers").html(tr);
            _actionsDriveuser();
        }
        else {
            console.log("some error occured");
        }
    });
}
function GetBasDriveExtraDriveList() {
    var param = {
        "userKey": $("#common_aKey").val(),
        "deviceInfo": device
    }
    getCommonData("BascrmBasdrive/GetBasDriveExtraDriveList", param, "new", function (result) {
        if (result.status) {
            console.log(result);
            var extraDriveList = result.extraDriveList;
            var length = extraDriveList.length;
            var tr = `<div class="col-lg-12">
                            <h5>You have`+ length + `drives of total 250 GB</h5>
                        </div>`;
            if (length > 0) {
                $.each(extraDriveList, function (i, drive) {
                    tr += ` <div class="col-lg-3">
                            <div class="card" data-key="abcdefghijklmn">
                                <div class="bg-holder bg-card" style="background-image:url(/assets/img/icons/spot-illustrations/corner-3.png);"></div>
                                <div class="card-body position-relative">
                                    <h4 class="mb-3"><span class="drive-name">`+ drive.drive_name + `</span> <a data-bs-toggle="tooltip" data-bs-placement="top" title="Edit drive name" href="javascript:void(0)" class="btn btn-falcon-default btn-sm _btnEditDriveName" data-name="150 GB" data-size="150GB"><i class="fas fa-pencil-alt fs--1"></i></a> <span class="badge badge-soft-primary fs--2 float-end">Shared</span></h4>
                                    <p class="mb-0">60.34 GB used of `+ drive.size + `</p>
                                    <div class="progress mb-3" style="height:15px">
                                      <div class="progress-bar bg-success" role="progressbar" style="width: 30%" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                                    </div>
                                    <div><a href="manageusers.aspx?drive=`+ drive.driveKey + `">Manage users</a> | <a href="storage.aspx?drive=">Manage storage</a></div>
                                </div>
                            </div>
                        </div>`;
                })
            }
            $("#body").html(tr);
        }
        else {
            console.log("some error occured");
        }
    });
}
function _actionsDriveuser() {
    $("._deactiveAccess").each(function () {
        $(this).click(function () {
            var msg = "";
            if ($(this).html() == "Deactivate") {
                msg = _deactivatingBasdriveUserAccessToExternalDrive;
            } else {
                msg = _activatingBasdriveUserAccessToExternalDrive;
            }
            swal({
                title: "",
                text: msg,
                icon: "warning",
                buttons: true,
                dangerMode: true,
            }).then((willDelete) => {
                if (willDelete) {
                    //var _CID = $(this).closest("li").attr("data-key");
                    //var param = {
                    //    "userKey": $("#common_aKey").val(),
                    //    "companyKey": $("#common_cKey").val(),
                    //    "configKey": _CID,
                    //    "deviceInfo": device
                    //}
                    //getCommonData("bascrmemail/DeactivateConfiguredEmailAddress", param, "new", function (result) {
                    //    if (result.status == true) {
                    //        _emailSettingAction();
                    //        bascrmShowErrorMessage("success", "fa-check-circle", "2500", "E-mail marked as default successfully!", "");
                    //    } else {
                    //        bascrmShowErrorMessage("danger", "fa-times", "2500", "Some error, Please try again!", "");
                    //    }
                    //});
                    bascrmShowErrorMessage("success", "fa-check-circle", "2500", "Actions successfully done!", "");
                    if ($(this).html() == "Deactivate") {
                        $(this).html("Activate");
                    } else {
                        $(this).html("Deactivate");
                    }

                }
            });
        });
    });

    $("._driveRemoveUser").each(function () {
        $(this).click(function () {
            swal({
                title: "",
                text: _removingBasdriveUserFromExternalDrive,
                icon: "warning",
                buttons: {
                    basckup: "Backup data",
                    confirm: "Remove data",
                    cancel: "Cancel",
                },
                dangerMode: true,
            }).then((willDelete) => {
                if (willDelete) {
                    var memberKey = $(this).closest("div").find("input[name='data']").val();
                    var tr = $(this).closest('tr');
                    RemoveBasDriveExtraDriveMember(tr,memberKey);

                } else if (willDelete == "confirm") {
                    bascrmShowErrorMessage("success", "fa-check-circle", "4500", "user access removed successfully!", "Depending on the size of data it will be removed in background!");
                    alert("Rahul");

                }
            });
        });
    });

    $("._driveBackup").each(function () {
        $(this).click(function () {
            swal({
                title: "",
                text: _backupBasdriveUserFromExternalDrive,
                icon: "warning",
                buttons: true,
                dangerMode: true,
            }).then((willDelete) => {
                if (willDelete) {
                    bascrmShowErrorMessage("success", "fa-check-circle", "4500", "Backup initiated!", "An e-mail will be send when the backup file generated successfully!");
                }
            });
        });
    })

    $("._btnEditDriveName").each(function () {
        $(this).click(function () {
            var name = $(this).attr("data-name");
            var size = $(this).attr("data-size");
            var key = $(this).closest(".card").attr("data-key");

            $("#_editDriveNme-size").html(size);
            $("#_editDriveName-name").val(name);

            $("#_editDriveName").offcanvas("show");

            $("#_btnEditDriveName-save").attr("data-key", key);

            $("#_btnEditDriveName-save").unbind("click");
            $("#_btnEditDriveName-save").click(function () {
                var k = $(this).attr("data-key");
                var eName = $("#_editDriveName-name").val();
                if (eName != "") {

                    $(".card[data-key='" + k + "']").find(".drive-name").html(eName);
                    bascrmShowErrorMessage("success", "fa-check-circle", "2500", "Saved successfully", "");
                } else {
                    bascrmShowErrorMessage("danger", "fa-times-circle", "2500", "Please specify name", "");
                }
            })
        })
    })
}

function RemoveBasDriveExtraDriveMember(tr,memberKey) {
    var param = {
        "userKey": $("#common_aKey").val(),
        "deviceInfo": device,
        "memberKey": memberKey,
        "dataAction":"remove"
    }

    console.log("calling remove function");
    getCommonData("BascrmBasdrive/RemoveBasDriveExtraDriveMember", param, "new", function (result) {
        console.log(result);
        if (result.status) {
            console.log(result);
            bascrmShowErrorMessage("success", "fa-check-circle", "4500", "user access removed successfully!", "Backup initiated, an e-mail will be send when the backup file generated successfully!");
            $(tr).remove();
        }
    });
}

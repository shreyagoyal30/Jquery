var currentView = "home";
var currentViewType = "recent";
var accessurl = "";
var windowscrollfree = true;

var fileProperty = "";
var _driveCurrentFolder = "";
var fileObjList = [];
var selectedParentItem = [];
var selectedGroupParentItem = [];
var userList = null;
var userControl;
var isCheckedItemDrive = [];
var sharePanelDocKey = "";
var sharePanelDocType = "";
document.addEventListener("DOMContentLoaded", () => {
    //plotChart();
    bascrmPanelHeightToMin();

    getPersonalFolders("0");
    getLinkFolders();
    getGroupFolders("0");
    GetBasDriveLocalDriveList();
    GetBasDriveSystemFolderList();
    getFoldersHierarchy();
    //getBasDriveSystemStorageUserWize();

    bindFileUploadButton();

    $(document).mouseup(function (e) {
        if ($("#_basDriveInputFileVersion").val().length == 0) {
            versionDocKey = "0";
        }
    });

    document.addEventListener("scroll", function (e) {
        let documentHeight = document.body.scrollHeight;
        let currentScroll = window.scrollY + window.innerHeight;
        // When the user is [modifier]px from the bottom, fire the event.
        let modifier = 1;
        if (windowscrollfree && (parseInt(currentScroll) + modifier >= parseInt(documentHeight))) {
            //console.log("You are at the bottom!")
            windowscrollfree = false;
            loadDriveData();
        }
    })
    $("#_DataFolderTreeview li a[data-item='home']").trigger("click");


    $("._BASdrive_search_list_top").on("keyup", function () {
        var value = $(this).val().toLowerCase();
        $("#_otherTabItems .table-content .drive-item").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });
    });

    // for display and filling the dropdown for group and users
    sharingControlUserGroup();

    // Enabling password secure sharing
    var _pwdEnablingSharing = $("#_chkPasswordSecureDriveAccess");
    _pwdEnablingSharing.change(function () {
        if (this.checked) {
            $("._securityPasswordForAccess").removeClass("disabled").removeAttr("disabled");
            $("._btnGeneratePasswordForSharing").removeClass("d-none").removeClass("disabled");

            $("._btnGeneratePasswordForSharing").unbind("click");
            $("._btnGeneratePasswordForSharing").click(function () {
                $("._securityPasswordForAccess").val(generateAlphaNumericPassword());
            })
        } else {
            $("._securityPasswordForAccess").addClass("disabled").attr("disabled", "disabled");
            $("._btnGeneratePasswordForSharing").addClass("disabled").addClass("d-none");
            $("._securityPasswordForAccess").val("");
        }
    })

    // Enabling password secure sharing
    var _expiryEnablingSharing = $("#_chkExpireSecureDriveAccess");
    _expiryEnablingSharing.change(function () {
        if (this.checked) {
            $("._expirySharingDate").removeClass("disabled").removeAttr("disabled");
            $(".datetimepicker").flatpickr($(this).attr("data-options"));
        } else {
            $("._expirySharingDate").addClass("disabled").attr("disabled", "disabled");
            $("._expirySharingDate").val("");
        }
    })

    // Finish and save sharing
    $("[data-action='finish-sharing']").unbind("click");
    $("[data-action='finish-sharing']").click(function () {

        $(this).html("Sharing please wait..");
        _finishSharingFilesFolders();
    });


    $("#btnCreateDriveFile").unbind("click");
    $("#btnCreateDriveFile").click(function () {
        console.log("save click");
        var type = $(this).attr("data-type");
        var fileName = $("#_txtFileName").val();
        var folderName = $("#_ddlParentGroupFolder option:selected").text();
        var folderKey = $("#_ddlParentGroupFolder").val();
        fileName = fileName + type;
        createBasDriveFile(fileName, folderName, folderKey, function (res) {
            $("#_driveFile_new").offcanvas("hide");
            console.log(res);
            var path = encodeURIComponent(res.fileFullPath);
            var name = encodeURIComponent(fileName);
            var key = encodeURIComponent(moment().format("HH:mm:ss.SSS").replace(/:/g, "").replace(".", "") + "aqkpm" + new Date().valueOf() + "j");
            var url = "/modules/basdrive/editor?p=" + path + "&n=" + name + "&k=" + key + "&m=edit&s=" + encodeURIComponent(1) + "";
            var link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.dispatchEvent(new MouseEvent('click'));
            $("#_txtFileName").val("");
        });

    });

    $("[data-action='create-file']").unbind("click");
    $("[data-action='create-file']").each(function () {
        $(this).click(function () {
            var type = $(this).attr("data-type");
            $("#btnCreateDriveFile").attr("data-type", "." + type);
            $("#_fileNameTypeLabel").html("." + type);
            $("#_driveFile_new").offcanvas("show");
        })
    })


});

var myOffcanvas = document.getElementById('_driveProgress_upload')
myOffcanvas.addEventListener('hidden.bs.offcanvas', function () {
    $("#_driveProgress_upload .offcanvas-body").html("");
})


function loadDriveData() {
    var lastkey = $("#_otherTabItems div.drive-item").last().attr("data-key");
    getDataListing(currentView, "", "", lastkey, accessurl, function (result) {
        //if (currentView == "favorites") {
        //    callback(result);
        //} else if (currentView == "trash") {
        //    callback(result);
        //} else {
        //    callback(result);
        //}
        var table = "";
        $.each(result, function (i, f) {
            createListRow(f, function (result) {
                table += result;
            });
        })
        if (windowscrollfree) {
            $("#_otherTabItems .card-body").html(table);
        } else {
            $("#_otherTabItems .card-body").append(table);
        }
        glightboxInit();
        //console.log(result);
        windowscrollfree = true;

        bindIconClickActions();
        _bindCheck();
    })
}

function isValidEmail(sEmail) {
    var filter = /^[\w\-\.\+]+\@[a-zA-Z0-9\.\-]+\.[a-zA-z0-9]{2,6}$/;
    if (filter.test(sEmail)) { return true; } else { return false; }
}

function sharingControlUserGroup() {
    getUserList(function (result) {
        userList = result;
    });

    getGroupFolders("0", "", "share", function (res) {
    });
}

function setUserListForSelectize(userList) {
    resetSelectizeUserControl();
    userControl = $("#_listUsersForShare").selectize({
        persist: false,
        maxItems: 1,
        valueField: "UserKey",
        labelField: "Email",
        searchField: ["Name", "Email"],
        sortField: "Name",
        create: true,
        options: userList,
        closeAfterSelect: true,
        placeholder: "Select user to share",
        create: function (email) {
            if (isValidEmail(email)) {
                return { Email: email, UserKey: 0, Name: email };
            } else {
                bascrmShowErrorMessage("danger", "fa-times-circle", "1500", "Invalid email address", "");
                return false;
            }
        },
        onItemAdd: function (value, item) {
            if ($("._listUsersGroupToShare li[data-email='" + item.attr("data-email") + "']").length == 0) {
                $("._listUsersGroupToShare").append("<li class='list-group-item d-flex align-items-center justify-content-between' data-key='" + item.attr("data-value") + "' data-email='" + item.attr("data-email") + "' data-username='" + item.attr("data-name") + "'><div>" + item.attr("data-name") + " <span class='_axpRights badge badge-soft-secondary' data-right='read'>View only</span> <br>" + item.attr("data-email") + "</div><div><button class='btn btn-falcon-default dropdown-toggle btn-sm' type='button' data-bs-toggle='dropdown' aria-haspopup='true' aria-expanded='false'><i class='fas fa-cog'></i></button><div class='dropdown-menu dropdown-menu-end py-0' aria-labelledby='dropdownMenuButton'><a class='dropdown-item' href='javascript:void(0)' onclick=setAccessRightsForFileFolder(this) data-value='View only'>View only</a><a class='dropdown-item' href='javascript:void(0)' data-value='Editor' onclick=setAccessRightsForFileFolder(this)>Editor</a><a class='dropdown-item' href='javascript:void(0)'  onclick=setAccessRightsForFileFolder(this) data-value='Owner' >Owner</a><div class='dropdown-divider'></div><a class='dropdown-item text-danger' href='javascript:void(0)' onclick=_removeUserGroupFromSharing(this)>Remove</a></div></div></li>");
            }
        },
        render: {
            item: function (item, escape) {
                var userName = "";
                if (item.Name == undefined || item.Name == null || item.Name == "") {
                    userName = "";
                } else {
                    userName = item.Name;
                }

                return (
                    "<div data-value='" + item.userKey + "' data-email='" + item.Email + "' data-name='" + userName + "' class='p-1'>" + item.Name + " [" + item.Email + "]</div>"
                );

            },
            option: function (item, escape) {
                return (
                    "<div data-value='" + item.userKey + "' class='p-1'>" + item.Name + " [" + item.Email + "]</div>"
                );
            },
        }
    });
}

function resetSelectizeUserControl() {
    try {
        var control = userControl[0].selectize;
        control.clear();
    } catch (e) { }

    $("._listUsersGroupToShare li").remove();
}

function setAccessRightsForFileFolder(e) {
    var accessright = $(e).attr("data-value");
    $(e).closest("li").find("._axpRights").removeClass("badge-soft-secondary").removeClass("badge-soft-primary").removeClass("badge-soft-success");
    if (accessright.toLowerCase() == "view only") {
        $(e).closest("li").find("._axpRights").text(accessright).addClass("badge-soft-secondary").attr("data-right", "read");
    } else if (accessright.toLowerCase() == "editor") {
        $(e).closest("li").find("._axpRights").text(accessright).addClass("badge-soft-primary").attr("data-right", "read,readwrite,share");
    } else if (accessright.toLowerCase() == "owner") {
        $(e).closest("li").find("._axpRights").text(accessright).addClass("badge-soft-success").attr("data-right", "read,readwrite,share,delete");
    }

}
function _removeUserGroupFromSharing(e) {
    $(e).closest("li").remove();
}
function _bindCheck() {
    $("._itemCheck").change(function () {
        var key = $(this).closest(".table-row").attr("data-key");
        var dataType = $(this).closest(".table-row").attr("data-type");
        var parentType = $(this).closest(".table-row").attr("data-parent-type");
        //$(this).toggleClass("checked");
        if ($(this).is(":checked")) {
            $(this).addClass("checked");
            isCheckedItemDrive.push({
                "documentKey": key,
                "documentType": dataType,
                "flagType": currentViewType,
                "e": $(this),
                "name": $(this).closest(".drive-item").find("._file_name_main").text()
            });

            // When multiple files are selected, the below code is for adding the files into the dropdown list
            if ($("#_selectedFolderFoldersList").find(".listhead").length == 0) {
                $("<div class='listhead ps-2 pb-2 text-secondary fw-bold'>Selected file list</div>").insertBefore($("#_selectedFolderFoldersList ._itemLis"));
            }
            $("#_selectedFolderFoldersList ._itemLis").append("<li class='dropdown-item' data-key='" + key + "' data-type='" + dataType + "' data-parent-type='" + parentType + "'><i class='fas fa-" + dataType.toLowerCase() + " me-2'></i> " + $(this).closest(".drive-item").find("._file_name_main").text() + "<a href='javascript:void(0)' class='_btnRemoveUniqueUrlClickLink float-end  ms-3'><i class='fas fa-times'></i></a></li>");
            // Ends
        }
        else {
            // updated by VIJAY
            deSelectDocument(key, dataType);
            //isCheckedItemDrive = removeByAttr(isCheckedItemDrive, 'documentKey', key);            
            //$("#_selectedFolderFoldersList li[data-key='" + key + "']").remove();
        }

        // Updated by VIJAY

        if (isCheckedItemDrive.length > 0) {
            $("._checked_actions_").show();
            $("#_selectedFileForLink").html(isCheckedItemDrive.length + " selected");
        }
        //else {
        //    $("._checked_actions_").hide();
        //}

        if (isCheckedItemDrive.length > 1) {
            $("._checked_actions_ ._link").addClass("disabled");
        }
        else {
            $("._checked_actions_ ._link").removeClass("disabled");
        }

        // Remove from Unique URL file list
        $("._btnRemoveUniqueUrlClickLink").unbind("click");
        $("._btnRemoveUniqueUrlClickLink").each(function () {
            $(this).click(function () {
                var key = $(this).closest("li").attr("data-key");
                var docType = $(this).closest("li").attr("data-type");
                // updated by VIJAY
                deSelectDocument(key, docType);

                //$("#_selectedFileForLink").html((isCheckedItemDrive.length - 1) + " selected");
                //removeByAttr(isCheckedItemDrive, 'documentKey', key)

                //$(this).closest("li").remove();
                //$("#_otherTabItems .table-content .drive-item[data-key='" + key + "'] ._itemCheck").removeClass("checked").prop("checked", false);
            })
        })
    });
}

function deSelectDocument(docKey, docType) {
    $("#_otherTabItems .table-content .drive-item[data-key='" + docKey + "'][data-type='" + docType + "'] ._itemCheck").removeClass("checked").prop("checked", false);
    $("#_selectedFolderFoldersList li[data-key='" + docKey + "'][data-type='" + docType + "']").remove();
    $("._listFilesFoldersToShare li[data-key='" + docKey + "'][data-type='" + docType + "']").remove();

    // remove item from array
    const index = isCheckedItemDrive.findIndex(x => x.documentKey === docKey && x.documentType === docType);
    if (index > -1) {
        isCheckedItemDrive.splice(index, 1);
    }

    $("#_selectedFileForLink").html(isCheckedItemDrive.length + " selected");

    if (isCheckedItemDrive.length > 0) {
        $("._checked_actions_").show();
    }
    else {
        $("._checked_actions_").hide();
    }
}

function resetDocumentSelection() {
    isCheckedItemDrive = [];
    $("#_otherTabItems .drive-item ._itemCheck").removeClass("checked").prop("checked", false);
    $("#_selectedFolderFoldersList li.dropdown-item").remove();
    $("._listFilesFoldersToShare li").remove();
    $("#_selectedFileForLink").html(isCheckedItemDrive.length + " selected");
    if (isCheckedItemDrive.length > 0) {
        $("._checked_actions_").show();
    }
    else {
        $("._checked_actions_").hide();
    }
    resetSelectizeUserControl();
}



function bindIconClickActions() {
    //$("[data-action='doc-preview']").unbind("click");
    //$("[data-action='doc-preview']").each(function () {
    //    $(this).click(function (e) {
    //        e.preventDefault();

    //        showOnlyEdit(path, name, key, "view", "");


    //    });
    //});

    // folder click in grid
    var ele = $(".drive-item[data-type!='file'][data-type!='File'] a._file_name_main");
    ele.off("click");
    ele.on("click", function () {
        var res = [];
        res.push({
            "name": $(this).text(),
            "key": $(this).parents(".drive-item").attr("data-key"),
            "type": $(this).parents(".drive-item").attr("data-parent-type"),
            "guid": $(this).text()
        })
        accessItem("", res);
    });

    // unique link muliple
    $("[data-action='unique-link-multiple']").unbind("click");
    $("[data-action='unique-link-multiple']").each(function () {
        $(this).click(function () {
            $(this).html("<i class='fas fa-spinner fa-spin me-2'></i> Generating..");
            getUniqueURL($(this));
        })
    })

    // Files delete
    $("[data-action='file-delete'],[data-action='file-delete-multiple']").unbind("click");
    $("[data-action='file-delete'],[data-action='file-delete-multiple']").each(function () {
        $(this).click(function () {
            //$(this).closest(".table-row").find("._itemCheck").click();
            var type = $(this).closest(".table-row").attr("data-type");
            var key = $(this).closest(".table-row").attr("data-key");
            goToActionDocumentRemove($(this).closest(".table-row"), function (d) {
                if (d == "ok") {
                    $("._checked_actions_").hide();
                    $("#_otherTabItems").find(".table-row[data-key='" + key + "'][data-type='" + type + "']").remove();
                    $.each(isCheckedItemDrive, function (i, val) {
                        $("#_otherTabItems div.drive-item[data-key='" + val.documentKey + "'][data-type='" + val.documentType + "']").remove();
                    });
                    resetDocumentSelection();
                }
            });
        });
    })

    // Files move
    $("[data-action='file-move-multiple']").unbind("click");
    $("[data-action='file-move-multiple']").each(function () {
        $(this).click(function () {
            getFoldersHierarchy();
            $("#_ddlMoveOptionTitle").html("Select a folder to move above " + isCheckedItemDrive.length + " items");
            $("#_driveMove").offcanvas("show");
            var item = "";
            $.each(isCheckedItemDrive, function (i, res) {
                var itemname = $(res.e).closest(".drive-item").find("._file_name_main").text();
                var ext = "<img src='" + $(res.e).closest(".drive-item").find(".avatar img").attr("src") + "' height='16' />";
                item += "<li class='list-group-item text-truncate'>" + ext + " " + itemname + "</li>";
            });
            $("#itemListDriveForMove").html(item);
        });
    });

    // Files Copy
    $("[data-action='file-copy-multiple']").unbind("click");
    $("[data-action='file-copy-multiple']").each(function () {
        $(this).click(function () {
            getFoldersHierarchy();
            $("#_ddlCopyOptionTitle").html("Select a folder to move above " + isCheckedItemDrive.length + " items");
            $("#_driveCopy").offcanvas("show");
            var item = "";
            $.each(isCheckedItemDrive, function (i, res) {
                var itemname = $(res.e).closest(".drive-item").find("._file_name_main").text();
                var ext = "<img src='" + $(res.e).closest(".drive-item").find(".avatar img").attr("src") + "' height='16' />";
                item += "<li class='list-group-item text-truncate'>" + ext + " " + itemname + "</li>";
            });
            $("#itemListDriveForCopy").html(item);
        });
    });

    // Files info
    $("[data-action='file-info']").unbind("click");
    $("[data-action='file-info']").each(function () {
        $(this).click(function () {
            /*fileProperty =  $(this).closest(".drive-item").attr("data-key");*/
            goToActionDocumentInfo($(this).closest(".drive-item"));
        });
    });

    // Files download single
    $("[data-action='file-download']").unbind("click");
    $("[data-action='file-download']").each(function () {
        $(this).click(function () {

            var docType = $(this).closest(".drive-item").attr("data-type");
            if (docType.toLowerCase() == "file") {
                goToActionDocumentDownload($(this).attr("data-downloadpath"));
            }
            else {
                goToActionDocumentCompress($(this));
            }
            //$.each($("._itemCheck"), function (i, v) {
            //    if ($(v).hasClass("checked")) {
            //        $(v).trigger("click");
            //    }
            //});
        });
    });

    // Files download multiple
    $("[data-action='file-download-multiple']").unbind("click");
    $("[data-action='file-download-multiple']").each(function () {
        $(this).click(function () {
            goToActionDocumentCompress($(this));

            $.each($("._itemCheck"), function (i, v) {
                if ($(v).hasClass("checked")) {
                    $(v).trigger("click");
                }
            });
        });
    });

    // File version 
    $("[data-action='file-version']").unbind("click");
    $("[data-action='file-version']").each(function () {
        $(this).click(function () {
            versionDocKey = $(this).closest(".drive-item").attr("data-key");
            $("#_basDriveInputFileVersion").trigger("click");
        });
    });

    // File share 
    $("[data-action='file-share']").unbind("click");
    $("[data-action='file-share']").each(function () {
        $(this).click(function () {
            $(this).closest(".drive-item").find("._itemCheck").prop("checked", true);
            $(this).closest(".drive-item").find("._itemCheck").trigger("change");
            //if (isCheckedItemDrive.length > 0) {
            //    isCheckedItemDrive = removeByAttr(isCheckedItemDrive, 'documentKey', $(this).closest(".drive-item").attr("data-key"));
            //}
            //isCheckedItemDrive.push({
            //    "documentKey": $(this).closest(".drive-item").attr("data-key"),
            //    "documentType": $(this).closest(".drive-item").attr("data-type"),
            //    "flagType": currentViewType,
            //    "e": $(this),
            //    "name": $(this).closest(".drive-item").find("._file_name_main").text()
            //});

            //$("._itemCheck").trigger("change");
            $("._checked_actions_ ._share").trigger("click");
        });
    })

    $("._checked_actions_ ._share").unbind("click");
    $("._checked_actions_ ._share").each(function () {
        $(this).click(function () {
            //$(this).closest(".drive-item").find("._itemCheck").

            //isCheckedItemDrive = [];
            //var grid = $("#_otherTabItems .drive-item");
            //$.each(grid, function (i, k) {
            //    if ($(k).find("._itemCheck").is(":checked")) {
            //        isCheckedItemDrive.push({
            //            "documentKey": $(k).attr("data-key"),
            //            "documentType": $(k).attr("data-type"),
            //            "flagType": currentViewType,
            //            "e": $(k),
            //            "name": $(k).find("._file_name_main").text()
            //        });
            //    }
            //});

            goToActionDocumentShare();
        });
    });

    // File preview
    //$("[data-action='file-preview']").unbind("click");
    //$("[data-action='file-preview']").each(function () {
    //    $(this).click(function () {

    //        var isValidPreview = false;
    //        var isEditable = false;
    //        var isImage = false;
    //        var isVideo = false;
    //        var isAudio = false;
    //        var isDoc = false;
    //        if (filetypeEdit.split(',').indexOf("." + ext) > -1) {
    //            isDoc = true;
    //            isEditable = true;
    //            isValidPreview = true;
    //        } else if (fileTypeImage.split(',').indexOf("." + ext) > -1) {
    //            isImage = true;
    //            isValidPreview = true;
    //        } else if (fileTypeVideo.split(',').indexOf("." + ext) > -1) {
    //            isVideo = true;
    //            isValidPreview = true;
    //        } else if (fileTypeAudio.split(',').indexOf("." + ext) > -1) {
    //            isAudio = true;
    //            isValidPreview = true;
    //        }

    //        if (isImage) {

    //        } else if (isVideo) {

    //        } else if (isAudio) {

    //        } else if(isDoc) {

    //        }
    //    });
    //});

    // File-Email
    $("[data-action='file-email']").unbind("click");
    $("[data-action='file-email']").each(function () {
        $(this).click(function () {
            //var type = $(this).closest(".table-row").attr("data-type");
            //var key = $(this).closest(".table-row").attr("data-key");
            //console.log(type, key);
            goToActionSendDocumentAsEmail($(this).closest(".table-row"));
        });
    })
}


function _handleUploadingNewFileVersion(ev) {
    //var inputElement = document.getElementById("input");
    //var fileList = inputElement.files; /* now you can work with the file list */
    //var file = { type: "", name: "", size: "" };

    //for (var k = 0; k < fileList.length; k++) {
    //    file.name.push(fileList[k].name);
    //    file.type.push(fileList[k].type);
    //    file.size.push(fileList[k].size);
    //    //and others
    //}
    if (ev.target.files) {
        // Use DataTransferItemList interface to access the file(s)
        [...ev.target.files].forEach((item, i) => {
            // If dropped items aren't files, reject them
            if (item.kind === 'file') {
                const file = [];
                file.push({
                    "fileObj": item.getAsFile(),
                    "fid": "fid_" + moment().format("x")
                });

                console.log(file);
                _uploadBasdriveFiles(file[0], _driveCurrentFolder, currentViewType, function (res) {
                    //console.log(res);
                    loadDriveData();
                })
            }
        })
    }
}

function getEmailDataForFileEmail(ele, callback) {
    //docType: file/fileVersion/folder
    var param = {
        "userKey": $("#common_aKey").val(),
        "deviceInfo": device,
        "docType": ele.attr("data-type"),
        "docKey": ele.attr("data-key"),
        "flagType": (ele.attr("data-parent-type") == "recent" ? "file" : ele.attr("data-parent-type"))
    }
    getCommonData("bascrmbasdrive/GetBasDriveDocumentEmailTemplate", param, "new", function (result) {
        if (result.status) {
            if (callback != null) {
                callback(result);
            }
        } else {
            bascrmShowErrorMessage("danger", "fa-check-circle", "2000", "Some error occurred, please try again!", "");
        }
    });
}

function openNested(e) {
    if ($(e).parent().find(".nested-tree").hasClass("d-none")) {
        $(e).parent().find(".nested-tree").removeClass("d-none");
        $(e).find(".icon-right-arrow").removeClass("fa-chevron-right").addClass("fa-chevron-down");
    }
    else {
        $(e).parent().find(".nested-tree").addClass("d-none");
        $(e).find(".icon-right-arrow").addClass("fa-chevron-right").removeClass("fa-chevron-down");
    }
}

function accessItem(e, data) {
    $("#drive-items-listing").removeClass("d-none");
    $("#drive-items-links").addClass("d-none");

    $("#mainSearchBASDrive").removeClass("d-none");
    //$("#_otherTabItems .card-body").html("");
    //$("._breadcrumbs_main").append(showBASCRMLoading());
    if (e != "") {
        var item = $(e).attr("data-item");
        currentView = item;
        var type = $(e).attr("data-type");
        var name = $(e).find(".treeview-text").html();
        var href = $(e).attr("href").replace("#", "");
        var dKey = "";
        var url = "";
        var fType = "";
        if ($(e).closest(".treeview-list-item").attr("data-key") != undefined) {
            _driveCurrentFolder = $(e).closest(".treeview-list-item").attr("data-key");
        }
    }
    else {
        //if (data[0].type == "folder") {
        //    data[0].type = "personal";
        //} else if (data[0].type == "system") {
        //    data[0].type = "system";
        //} else if (data[0].type == "localdrive") {
        //    data[0].type = "drive";
        //}
        var item = data[0].name
        currentView = item;
        var type = data[0].type;
        var name = item;
        var href = data[0].guid;
        var dKey = "";
        var url = "";
        var fType = "";
        _driveCurrentFolder = data[0].key;
        //if ($(e).closest(".treeview-list-item").attr("data-key") != undefined) {
        //    _driveCurrentFolder = $(e).closest(".treeview-list-item").attr("data-key");
        //}
    }
    window.history.pushState('data', "", "/modules/basdrive/drive#" + href);

    $("#_homeTabItems").hide();
    $("#_otherTabItems").show();
    $("._pnl_folder_information").hide();
    $("._pnl_Listing").removeClass("col-9").addClass("col-12");
    $("._breadcrumbs_main").remove();
    if (type == "folder") {
        $("._pnl_path_file").html("<nav aria-label='breadcrumb' class='_breadcrumbs_main'>\
                                    <ol class='breadcrumb'>\
                                    <li class='breadcrumb-item'><a href='#'>Home</a></li>\
                                    <li class='breadcrumb-item'><a href='#'>Personal folders</a></li>\
                                    <li class='breadcrumb-item text-capitalize'>"+ name + "</li>\
                                    </ol>\
                                    </nav>");
        if (e == "") {
            dKey = data[0].key;
        } else {
            dKey = $(e).closest("li").attr("data-key");
        }
        url = "GetBasDriveFolderDetailsList";
        fType = "folder";
        currentViewType = "folder";
    }
    else if (type == "system") {
        $("._pnl_path_file").html("<nav aria-label='breadcrumb' class='_breadcrumbs_main'>\
                                    <ol class='breadcrumb'>\
                                    <li class='breadcrumb-item'><a href='#'>Home</a></li>\
                                    <li class='breadcrumb-item'><a href='#'>System folders</a></li>\
                                    <li class='breadcrumb-item text-capitalize'>"+ name + "</li>\
                                    </ol>\
                                    </nav>");
        if (e == "") {
            dKey = data[0].key;
        } else {
            dKey = $(e).closest("li").attr("data-key");
        }
        url = "GetBasDriveFolderDetailsList";
        fType = "system";
        currentViewType = "system";
    }
    else if (type == "link") {
        $("._pnl_path_file").html("<nav aria-label='breadcrumb' class='_breadcrumbs_main'>\
                                    <ol class='breadcrumb'>\
                                    <li class='breadcrumb-item'><a href='#'>Home</a></li>\
                                    <li class='breadcrumb-item'><a href='#'>Link</a></li>\
                                    <li class='breadcrumb-item text-capitalize'>"+ name + "</li>\
                                    </ol>\
                                    </nav>");
        dKey = $(e).closest("li").attr("data-key");
        url = "GetBasDriveFolderDetailsList";
        fType = "link";
    }
    else if (type == "group") {
        $("._pnl_path_file").html("<nav aria-label='breadcrumb' class='_breadcrumbs_main'>\
                                    <ol class='breadcrumb'>\
                                    <li class='breadcrumb-item'><a href='#'>Home</a></li>\
                                    <li class='breadcrumb-item'><a href='#'>Groups</a></li>\
                                    <li class='breadcrumb-item text-capitalize'>"+ name + "</li>\
                                    </ol>\
                                    </nav>");
        if (e == "") {
            dKey = data[0].key;
        } else {
            dKey = $(e).closest("li").attr("data-key");
        }
        url = "GetBasDriveFolderDetailsList";
        fType = "group";
        currentViewType = "group";
    }
    else if (type == "localdrive") {
        $("._pnl_path_file").html("<nav aria-label='breadcrumb' class='_breadcrumbs_main'>\
                                    <ol class='breadcrumb'>\
                                    <li class='breadcrumb-item'><a href='#'>Home</a></li>\
                                    <li class='breadcrumb-item'><a href='#'>External Drive</a></li>\
                                    <li class='breadcrumb-item text-capitalize'>"+ name + "</li>\
                                    </ol>\
                                    </nav>");
        if (e == "") {
            dKey = data[0].key;
        } else {
            dKey = $(e).closest("li").attr("data-key");
        }
        url = "GetBasDriveFolderDetailsList";
        fType = "localdrive";
        currentViewType = "localdrive";
    }
    //else if (type == "system") {
    //    $("._pnl_path_file").html("<nav aria-label='breadcrumb' class='_breadcrumbs_main'>\
    //                            <ol class='breadcrumb'>\
    //                            <li class='breadcrumb-item'><a href='#'>Home</a></li>\
    //                            <li class='breadcrumb-item'><a href='#'>System Folders</a></li>\
    //                            <li class='breadcrumb-item text-capitalize'>"+ name + "</li>\
    //                            </ol>\
    //                            </nav>");
    //    dKey = $(e).closest("li").attr("data-key");
    //    url = "GetBasDriveFolderDetailsList";
    //    fType = "system";
    //}
    else if (type == "common") {
        _driveCurrentFolder = "";
        $("._pnl_path_file").html("<nav aria-label='breadcrumb' class='_breadcrumbs_main'>\
                                    <ol class='breadcrumb'>\
                                    <li class='breadcrumb-item'><a href='#'>Home</a></li>\
                                    <li class='breadcrumb-item text-capitalize'>"+ name + "</li>\
                                    </ol>\
                                    </nav>");
        if (item == "favorites") {
            url = "GetBasDriveFavoriteItemList";
            fType = item;
        }
        else if (item == "trash") {
            url = "GetBasDriveTrashItemList";
            fType = item;
        }
        else if (item == "share to me") {
            url = "GetBasDriveShareToMeItemList";
            fType = item;
        }
        else if (item == "share by me") {
            url = "GetBasDriveShareByMeItemList";
            fType = item;
        }
        else if (item == "home") {

            getBasDriveSystemStorageUserWize();
            $("._pnl_folder_information").show();
            $("._pnl_Listing").addClass("col-9").removeClass("col-12");
            $("._breadcrumbs_main").remove();
            $("._pnl_path_file").html("<nav aria-label='breadcrumb' class='_breadcrumbs_main'>\
                                    <ol class='breadcrumb'>\
                                    <li class='breadcrumb-item'><a href='#'>Home</a></li>\
                                    </ol>\
                                    </nav>");
            $("#_homeTabItems").show();
            $("#_otherTabItems").hide();
            currentViewType = "home";

            url = "GetBasDriveRecentItemList";
            fType = item;
            recordCount = "4";
            $("#_basDriveSuggestedItems").html("<div class='d-flex align-items-center justify-content-center pnlLoading'>" + showBASCRMLoading() + "</div>");
            getDataListing(item, dKey, fType, "0", url, function (result) {
                createSuggestedItemList(result);
            });

            $("#recentActionListFilter a[data-type='document']").unbind("click");
            $("#recentActionListFilter a[data-type='document']").click(function () {
                recordCount = "5";
                $("#recentActionListFilter a").removeClass("active");
                $(this).addClass("active");
                $("._tableRecentDataTopFive").html("<div class='d-flex align-items-center justify-content-center pnlLoading'>" + showBASCRMLoading() + "</div>");
                getDataListing("recent_document", dKey, fType, "0", url, function (result) {
                    $(".pnlLoading").remove();
                    createCustomDataListHome(result, "._tableRecentDataTopFive");
                });
            })

            $("#recentActionListFilter a[data-type='excel']").unbind("click");
            $("#recentActionListFilter a[data-type='excel']").click(function () {
                recordCount = "5";

                $("#recentActionListFilter a").removeClass("active");
                $(this).addClass("active");
                $("._tableRecentDataTopFive").html("<div class='d-flex align-items-center justify-content-center pnlLoading'>" + showBASCRMLoading() + "</div>");
                getDataListing("recent_spreadsheet", dKey, fType, "0", url, function (result) {
                    $(".pnlLoading").remove();
                    createCustomDataListHome(result, "._tableRecentDataTopFive");
                });
            })

            $("#recentActionListFilter a[data-type='presentation']").unbind("click");
            $("#recentActionListFilter a[data-type='presentation']").click(function () {
                recordCount = "5";

                $("#recentActionListFilter a").removeClass("active");
                $(this).addClass("active");
                $("._tableRecentDataTopFive").html("<div class='d-flex align-items-center justify-content-center pnlLoading'>" + showBASCRMLoading() + "</div>");
                getDataListing("recent_presentation", dKey, fType, "0", url, function (result) {
                    $(".pnlLoading").remove();
                    createCustomDataListHome(result, "._tableRecentDataTopFive");
                });
            })

            $("#recentActionListFilter a[data-type='document']").trigger("click");

            recordCount = "5";
            $("._tableRecentSharedTopFive").html("<div class='d-flex align-items-center justify-content-center pnlLoading'>" + showBASCRMLoading() + "</div>");
            getDataListing("share to me", dKey, fType, "0", "GetBasDriveShareToMeItemList", function (result) {
                createCustomDataListHome(result, "._tableRecentSharedTopFive");
            });

            return false;

        }
        else {
            url = "GetBasDriveRecentItemList";
        }
        accessurl = url;
    }
    $("#_group_memberList").remove();
    $("._pnl_path_file").attr("data-parent-type", type);

    loadDriveDataWithHeader(item, dKey, fType, url);




}

function loadDriveDataWithHeader(item, dKey, fType, url) {
    getDataListing(item, dKey, fType, "0", url, function (result) {
        $(window).scrollTop(0);
        var mList = "";
        if (fType == "group" || fType == "system") {
            if (result.GroupMemberList.length > 0) {
                mList += "<div class='row g-3 d-flex justify-content-between align-items-center' id='_group_memberList'><div class='col-lg-10'><div class='avatar-group  m-2'>";
                $.each(result.GroupMemberList, function (i, gml) {
                    mList += "<div class='avatar avatar-3xl border border-2 border-light rounded-circle' data-bs-toggle='tooltip' data-bs-placement='top' title='" + gml.name + " [" + gml.email + "]'><img class='rounded-circle' src='https://crm.bascrm.com/UploadContracts/employee" + gml.empid + ".png' alt='' onerror=checkIfImageExists(this) /></div>";
                })
                mList += "</div></div><div class='col-lg-2'><div class='btn-group' data-group-key='" + dKey + "' data-group-name='" + item + "' data-group-type='" + fType + "'><a href='javascript:void(0)' onclick='openAddGroupMemberPanel(this)' class='btn btn-outline-secondary btn-sm'><i class='fas fa-user'></i> Add</a><a href='javascript:void(0)' class='btn btn-outline-secondary btn-sm'><i class='fas fa-cog'></i> Settings</a></div></div></div>";
            }
            result = result.FolderDetailsList;
        }
        if (result != "") {
            var table = "<div class='row border-bottom border-200 hover-actions-trigger hover-shadow py-2 px-1 mx-0 bg-soft-dark dark__bg-dark fs--1'>\
                <div class='col-auto d-none d-sm-block _col_auto_firt'>\
                  <div class='d-flex dark__bg-dark'>\
                    <div class='form-check mb-0 fs-0'></div>\
                  </div>\
                </div>\
                <div class='col col-lg-9 col-xxl-9 ps-4 pe-0 _col_auto_second header__item'>\
                  <div class='row'>\
                    <div class='col-lg-7 ps-md-0 mb-1 mb-md-0'>\
                      <div class='d-flex position-relative align-items-center fw-bold filter__link' id='filename'>\
                        File Name\
                      </div>\
                    </div>\
                     <div class='col-lg-3'>\
                    </div>\
                    <div class='col-lg-2 text-start p-0 d-none d-sm-block  fw-bold header__item' ><span class='filter__link' id='foldername'>Folder</span></div>\
                  </div>\
                </div>\
                <div class='col-lg-2 ms-auto p-0 text-end d-flex flex-column justify-content-between _col_dt header__item'><span class='me-3  fw-bold filter__link' id='lastupdate'>Last updated</span><span class='fas text-warning fa-star ms-auto mb-2 d-sm-none' data-fa-transform='down-7'></span></div>\
              </div>";
            table += "<div class='table-content'>"
            $.each(result, function (i, f) {
                createListRow(f, function (result) {
                    table += result;
                });
            })
            table += "</div>";
            $("#_otherTabItems .card-body").html(table);
            removeBASCRMLoading();
            glightboxInit();
            $(mList).insertBefore($(".table-content"));
            bindIconClickActions();
            $("._checked_actions_ a").attr("data-bs-toggle", "tooltip");
            tooltipInit();
            filterData();
            _bindCheck();
            _markedCheckedItemsChecked();
        } else {

            $("#_otherTabItems .card-body").html(_noItemBasDrive);
        }
    });
}

function _markedCheckedItemsChecked() {

    $.each(isCheckedItemDrive, function (i, k) {
        $("#_otherTabItems .table-content .drive-item[data-key='" + k.documentKey + "'] ._itemCheck").prop("checked", true).addClass("checked");
    })


}

function createSuggestedItemList(result) {
    var suggestedList = "";

    $.each(result, function (i, k) {
        var isLightBox = "", imgPreview = "", previewPath = "";
        var ext = k.athname.split('.').pop();
        if (filetypeEdit.split(',').indexOf("." + ext) > -1) {
            previewPath = createDocumentViewPath(k.athname, k.fileFullPath, k.hasnewserver, "view");
        } else if (fileTypeImage.split(',').indexOf("." + ext) > -1) {
            previewPath = k.fileFullPath;
            isLightBox = "data-gallery='gallery-image'";
            imgPreview = "<img class='img-fluid rounded d-none' src='" + k.fileFullPath + "' alt='' />";

        } else if (fileTypeVideo.split(',').indexOf("." + ext) > -1) {
            previewPath = k.fileFullPath;
            isLightBox = "data-gallery='gallery-video'";
            imgPreview = "<video class='img-fluid rounded d-none' src='" + k.fileFullPath + "' alt='' ></video>";
        } else if (fileTypeAudio.split(',').indexOf("." + ext) > -1) {
            previewPath = k.fileFullPath;
            isLightBox = "data-gallery='gallery-audio'";
            imgPreview = "<video class='img-fluid rounded d-none' src='" + k.fileFullPath + "' alt='' ></video>";
        }

        suggestedList += "<div class='col-lg-3 suggested-item' data-key='" + k.docKey + "' data-type='" + k.typeofobject.toLowerCase() + "' data-parent-type='" + k.type.toLowerCase() + "' >\
                    <div class='card text-center'>\
                        <div class='dropdown font-sans-serif btn-sm'>\
                            <a href='javascript:void(0)' class='btn btn-sm fs--1 text-600 btn-sm dropdown-toggle dropdown-caret-none ms-2 email-filter  position-absolute right-0 mt-2' style='right: 0px;' type='button' data-bs-toggle='dropdown' aria-haspopup='true' aria-expanded='false'><span class='fas fa-ellipsis-v'></span></a>\
                            <div class='dropdown-menu dropdown-menu-end border py-0' aria-labelledby='email-filter'>\
                                <div class='bg-white dark__bg-dark py-2'>\
                                    <a class='dropdown-item suggested-item-action' href='javascript:void(0)' data-action='addVersion'>Add version</a>\
                                    <a class='dropdown-item suggested-item-action' href='"+ previewPath + "' target='_blank' data-action='view' " + isLightBox + ">View" + imgPreview + "</a>\
                                    <a class='dropdown-item suggested-item-action' href='javascript:void(0)' data-action='share'>Share</a>\
                                    <a class='dropdown-item suggested-item-action' href='javascript:void(0)' data-action='sendViaEmail'>Send as attachment</a>\
                                    <a class='dropdown-item suggested-item-action' href='javascript:void(0)' data-action='download' data-downloadpath='"+ k.downloadPath + "'>Download</a>\
                                    <a class='dropdown-item suggested-item-action' href='#!' data-action='delete'>Delete</a>\
                                    <a class='dropdown-item suggested-item-action' href='#!' data-action='markAsFavorite'>Mark as favorite</a>\
                                </div>\
                            </div>\
                        </div>\
                        <div class='card-img-top'>\
                            <div class='avatar avatar-4xl p-3'>\
                                <img class='img-fluid' src='"+ k.icon + "' alt='File type' />\
                            </div>\
                        </div>\
                        <div class='card-body p-2'>\
                            <h5 class='card-title fs--1 text-nowrap text-truncate fw-normal text-start mb-0 _file_name_main'>"+ k.athname + "</h5>\
                            <div class='fs--2 text-start m-0 d-flex justify-content-between align-items-center'>\
                                <span><i class='fas fa-folder'></i> "+ k.parent_name + " </span>\
                            </div>\
                        </div>\
                    </div>\
                </div>";
    })
    $("#_basDriveSuggestedItems").html(suggestedList);

    bindSuggestedItemActions();
}



function createCustomDataListHome(result, panel) {
    $(window).scrollTop(0);
    var mList = "";
    if (result != "") {
        var table = "";
        table += "<div class='table-content'>"
        $.each(result, function (i, f) {
            createListRow(f, function (result) {
                table += result;
            }, "home");
        })
        table += "</div>";
        $(panel).append(table);
        glightboxInit();
        $(mList).insertBefore($(".table-content"));
        bindIconClickActions();
        tooltipInit();
        filterData();
        _bindCheck();
    } else {

        $(panel).html(_noItemBasDrive);
    }
}
function createListRow(f, callback, type) {
    var table = "";
    var ext = f.athname.split('.').pop();

    var editBtn = "";


    var previewBtn = "";
    var isValidPreview = false;
    var isLightBox = "";
    var imgPreview = "";
    var docEdit = "";
    var preview = "file-preview";
    var target = "";

    f.filePath = f.filePath.replaceAll("\\", "/");
    f.fileFullPath = f.fileFullPath.replaceAll("\\", "/");

    var hrefPath = f.fileFullPath;  // f.filePath.replaceAll("\\", "/").replace("/BascrmDocuments", baseDocsURL);

    if (filetypeEdit.split(',').indexOf("." + ext) > -1) {
        isValidPreview = true;
        preview = "doc-preview";
        docEdit = "doc-edit";



        var path = encodeURIComponent(hrefPath);
        var name = encodeURIComponent(f.athname);
        var key = encodeURIComponent(moment().format("HH:mm:ss.SSS").replace(/:/g, "").replace(".", "") + "aqkpm" + new Date().valueOf() + "j");
        hrefPath = "/modules/basdrive/editor?p=" + path + "&n=" + name + "&k=" + key + "&m=view&s=" + encodeURIComponent(f.hasnewserver) + "";
        hrefEditPath = "/modules/basdrive/editor?p=" + path + "&n=" + name + "&k=" + key + "&m=edit&s=" + encodeURIComponent(f.hasnewserver) + "";
        target = "target='_blank'";
        editBtn = "<a href='" + hrefEditPath + "' " + target + "  data-action='file-edit' class='btn btn-falcon-default btn-sm fs--1 p-2 pt-0 pb-0' type='button' data-bs-toggle='tooltip' data-bs-placement='top' title='Edit file'><span class='fas fa-pencil-alt'></span></a>";

    } else if (fileTypeImage.split(',').indexOf("." + ext) > -1) {
        isValidPreview = true;
        isLightBox = "data-gallery='gallery-image'";
        imgPreview = "<img class='img-fluid rounded d-none' src='" + f.fileFullPath + "' alt='' />";

    } else if (fileTypeVideo.split(',').indexOf("." + ext) > -1) {
        isLightBox = "data-gallery='gallery-video'";
        isValidPreview = true;
        imgPreview = "<video class='img-fluid rounded d-none' src='" + f.fileFullPath + "' alt='' ></video>";
    } else if (fileTypeAudio.split(',').indexOf("." + ext) > -1) {
        isValidPreview = true;
        isLightBox = "data-gallery='gallery-audio'";
        imgPreview = "<video class='img-fluid rounded d-none' src='" + f.fileFullPath + "' alt='' ></video>";
    }
    if (isValidPreview) {
        previewBtn = "<a " + isLightBox + " " + target + " href='" + hrefPath + "' data-edit='" + docEdit + "' data-action='" + preview + "' data-name='" + f.athname + "' class='btn btn-falcon-default btn-sm fs--1 p-2 pt-0 pb-0' type='button' data-bs-toggle='tooltip' data-bs-placement='top' title='" + f.athname + " [" + f.size + "]'><span class='fas fa-eye'></span>" + imgPreview + "</a>";
    }

    var isVersion = "";
    var fIcon = "";
    if (f.version > 0) {
        isVersion = "<a href='javascript:void(0)' data-key='" + f.docKey + "' onclick=GetBasDriveFileVersionList(this) data-action='file-edit' class='btn bg-soft-secondary btn-sm fs--1 p-2 pt-0 pb-0' type='button' data-bs-toggle='tooltip' data-bs-placement='top' title='File versions'><span class='fas fa-copy'></span> " + f.versioncount + "</a>";
    }
    var isShared = "";
    if (f.share > 0) {
        isShared = "<a href='javascript:void(0)' data-action='file-edit' onclick=GetBasDriveFileFolderShareDetails(this) class='btn bg-soft-secondary btn-sm fs--1 p-2 pt-0 pb-0' type='button' data-bs-toggle='tooltip' data-bs-placement='top' title='File shared'><span class='fas fa-share-alt'></span> " + f.sharecount + "</a>";
    }
    //console.log(f.share);
    if (f.icon == "") {
        if (f.typeofobject == "Folder") {
            fIcon = "<i class='fas fa-folder'></i>";
        }
    } else {
        fIcon = "<img class='rounded-soft' src='" + f.icon.replace("/images/", "/assets/img/") + "' alt='' />";
    }
    var isHide = "";
    var homeListPadding = "";
    if (type == "home") {
        isHide = "d-none";
        isShared = "";
        homeListPadding = "p-2";
    }


    var markItemClass = "";
    var markItemChecked = "";
    if (isCheckedItemDrive.length > 0) {
        if ($(isCheckedItemDrive).find(x => x.documentKey == f.docKey).length > 0) {
            markItemClass = "checked";
            markItemChecked = "checked";
        }
    }
    table += "<div class='table-row drive-item row border-bottom border-200 hover-actions-trigger hover-shadow py-2 px-1 mx-0  fs--1' data-key='" + f.docKey + "' data-type='" + f.typeofobject.toLowerCase() + "' data-parent-type='" + f.type.toLowerCase() + "'>\
                <div class='col-auto d-none d-sm-block _col_auto_firt "+ homeListPadding + "'>\
                  <div class='d-flex bg-white dark__bg-dark "+ isHide + "'>\
                    <div class='form-check mb-0 fs-0'><input class='form-check-input _itemCheck "+ markItemClass + "' type='checkbox'  data-bulk-select-row='data-bulk-select-row' " + markItemChecked + " /></div><span class='far fa-star ms-1' style='margin-top:1px;' data-fa-transform='down-4'></span>\
                  </div>\
                </div>\
                <div class='col col-lg-9 col-xxl-9 _col_auto_second'>\
                  <div class='row'>\
                    <div class='col-lg-6 ps-md-0 mb-1 mb-md-0'>\
                      <div class='d-flex position-relative align-items-center'>\
                        <div class='avatar avatar-s'>\
                         "+ fIcon + "\
                        </div>\
                        <div class='d-flex ms-2'><a class='stretched-link inbox-link _file_name_main' href='javascript:void(0)'>"+ f.athname + "</a> <div class='btn-group z-index-2 _file_action_buttons_hover ms-2'>" + isVersion + "</div><div class='btn-group z-index-2 _file_action_buttons_hover ms-2'>" + isShared + " </div> <div class='btn-group z-index-2 hover-actions _file_action_buttons_hover end-0'><button class='btn btn-falcon-default btn-sm fs--1 p-2 pt-0 pb-0' type='button' data-bs-toggle='tooltip' data-bs-placement='top' title='Copy link' data-type='unique-url' onclick=getUniqueURL(this)><span class='fas fa-copy'></span> Copy link</button></div></div>\
                      </div>\
                    </div>\
                     <div class='col-lg-4'> <div class='btn-group z-index-2 hover-actions _file_action_buttons_hover'>\
                     "+ editBtn + " <a href='javascript:void(0)' data-action='file-version' class='btn btn-falcon-default btn-sm fs--1 p-2 pt-0 pb-0' type='button' data-bs-toggle='tooltip' data-bs-placement='top' title='Add new version'><span class='fas fa-plus'></span></a>\
                    "+ previewBtn + "\
                    <a href='javascript:void(0)' data-action='file-share' class='btn btn-falcon-default btn-sm fs--1 p-2 pt-0 pb-0' type='button' data-bs-toggle='tooltip' data-bs-placement='top' title='Share file'><span class='fas fa-share-alt'></span></a>\
                    <a href='javascript:void(0)' data-action='file-email' class='btn btn-falcon-default btn-sm fs--1 p-2 pt-0 pb-0' type='button' data-bs-toggle='tooltip' data-bs-placement='top' title='E-mail file'><span class='fas fa-envelope'></span></a>\
                    <a href='javascript:void(0)' data-action='file-download' class='btn btn-falcon-default btn-sm fs--1 p-2 pt-0 pb-0' type='button' data-bs-toggle='tooltip' data-bs-placement='top' title='Download file' data-downloadpath='"+ f.downloadPath + "'><span class='fas fa-download'></span></a>\
                    <a href='javascript:void(0)' data-action='file-delete' class='btn btn-falcon-default btn-sm fs--1 p-2 pt-0 pb-0' type='button' data-bs-toggle='tooltip' data-bs-placement='top' title='Delete file'><span class='fas fa-trash'></span></a>\
                    <a href='javascript:void(0)' data-action='file-info' class='btn btn-falcon-default btn-sm fs--1 p-2 pt-0 pb-0' type='button' data-bs-toggle='tooltip' data-bs-placement='top' title='File info' ><span class='fas fa-info-circle'></span></a>\
                    </div>\
                    </div>\
                    <div class='col-lg-2 text-start p-0 d-none d-sm-block'><a href='#" + f.parent_name + "' data-key='" + f.parentKey + "' class='table-data'>" + f.parent_name + "</a></div>\
                  </div>\
                </div>\
                <div class='col-lg-2 ms-auto p-0 text-end d-flex flex-column justify-content-between _col_dt'><span class='me-3 table-data'  data-bs-toggle='tooltip' data-bs-placement='top' title='By " + f.uploaded_byname + "'>" + moment(f.updated).format(CONFIG.HHMMSS24) + "</span><span class='fas text-warning fa-star ms-auto mb-2 d-sm-none' data-fa-transform='down-7'></span></div>\
              </div>";
    if (callback != null) {
        callback(table);
    }
}

function plotChart() {
    Highcharts.chart('drive-storage', {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: 0,
            plotShadow: false
        },
        title: {
            text: '',
            align: 'center'
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        accessibility: {
            point: {
                valueSuffix: '%'
            }
        },
        plotOptions: {
            pie: {
                dataLabels: {
                    enabled: true,
                    distance: -50,
                    style: {
                        fontWeight: 'bold',
                        color: 'white'
                    }
                },
                startAngle: -90,
                endAngle: 90,
                size: '100%'
            }
        },
        series: [{
            type: 'pie',
            name: 'Storage',
            innerSize: '50%',
            data: [
                ['Used', 73.86],
                ['Free', 11.97]
            ]
        }]
    });
}



function getPersonalFolders(pfid, id) {

    var param = {
        "userKey": $("#common_aKey").val(),
        "parentFolderKey": pfid,
        "deviceInfo": device
    }
    getCommonData("bascrmbasdrive/GetBasDrivePersonalFolderList", param, "new", function (result) {
        if (result.status) {
            var mParent = "";
            if (pfid == "0") {
                if (result.personalFolderDataList.length > 0) {
                    $.each(result.personalFolderDataList, function (i, e) {
                        mParent += "<li class='treeview-list-item' id='" + e.uniqueKey + "' data-key='" + e.folderKey + "' data-index='" + i + "'>\
                            <a data-bs-toggle='collapse' data-unique='"+ e.uniqueKey + "' href='javascript:void(0)'  onclick=accessItem(this) role='button' aria-expanded='false'  data-type='folder' data-item='" + e.foldername + "'>\
                                <p class='treeview-text'>"+ e.foldername + "</p>\
                            </a>\
                            <ul></ul>\
                            </li>";
                    })
                } else {
                    mParent += "<li class='treeview-list-item'>No folders</li>"
                }
                $("#BD-personal-folders").html(mParent);
                $(".treeview-list-item a").unbind("click");
                $(".treeview-list-item a").each(function () {
                    $(this).click(function (e) {
                        e.preventDefault();
                        var key = $(e.target).parent().attr("data-key");
                        var id = $(e.target).attr("data-unique");
                        getPersonalFolders(key, id);
                    });
                });
            } else {
                //$("._"+id.replace("#","")).remove();
                var subChild = "";
                $.each(result.personalFolderDataList, function (i, e) {
                    subChild += "<li class='treeview-list-item' id='" + e.uniqueKey + "' data-key='" + e.folderKey + "' data-index='" + i + "' >\
                                    <a data-bs-toggle='collapse' data-unique='"+ e.uniqueKey + "' href='javascript:void(0)'  onclick=accessItem(this) role='button' aria-expanded='false'  data-type='folder' data-item='" + e.foldername + "'>\
                                      <p class='treeview-text'>"+ e.foldername + "</p>\
                                    </a>\
                                    <ul></ul>\
                                  </li>";
                })
                subChild += "";
                $("#" + id).find("ul").html(subChild).attr("class", "collapse treeview-list show " + id + "'");
                $(".treeview-list-item a").unbind("click");
                $(".treeview-list-item a").each(function () {
                    $(this).click(function (e) {
                        e.preventDefault();
                        var key = $(e.target).parent().attr("data-key");
                        var id = $(e.target).attr("data-unique");
                        getPersonalFolders(key, id);
                    });
                });
            }
            //treeviewInit();

        } else {
            bascrmShowErrorMessage("danger", "fa-check-circle", "2000", "Some error occurred, please try again!", "");
        }
    });

}

function getLinkFolders() {

    var param = {
        "userKey": $("#common_aKey").val(),
        "deviceInfo": device
    }
    getCommonData("bascrmbasdrive/GetBasDriveLinkFolderList", param, "new", function (result) {
        if (result.status) {
            //console.log(result);
            var mParent = "";

            if (result.linkFolderDataList.length > 0) {
                $.each(result.linkFolderDataList, function (i, e) {
                    mParent += "<li class='treeview-list-item'  id='" + e.uniqueKey + "' data-key='" + e.folderKey + "' data-index='" + i + "'>\
                            <a data-bs-toggle='collapse' href='#"+ e.groupname.replace(/ /g, "") + "' onclick='accessItem(this)' data-item='" + e.groupname + "' data-type='link' role='button' aria-expanded='false' class='noarrow noicon'>\
                              <p class='treeview-text'>\
                                  <span class='avatar avatar16x16'>\
                                      <img class='rounded-circle' onerror=checkIfImageExists(this) src='https://crm.bascrm.com/uploadcontracts/employee"+ e.imgKey + ".png' alt='' />\
                                  </span> \
                                  <span class='ps-1'>"+ e.groupname + "</span></p>\
                            </a>\
                          </li>";
                })
                $("#BD-link-folders").html(mParent);
            }

            //treeviewInit();

        } else {
            bascrmShowErrorMessage("danger", "fa-check-circle", "2000", "Some error occurred, please try again!", "");
        }
    });

}

function getGroupFolders(pfid, id, type) {
    var param = {
        "userKey": $("#common_aKey").val(),
        "parentFolderKey": pfid,
        "deviceInfo": device
    }
    getCommonData("bascrmbasdrive/GetBasDriveGroupList", param, "new", function (result) {
        if (result.status) {
            if (type == "create") {
                $("#_ddlParentGroup").selectize({
                    persist: false,
                    valueField: "groupKey",
                    labelField: "groupname",
                    searchField: ["groupname"],
                    sortField: "groupname",
                    closeAfterSelect: true,
                    create: false,
                    options: result.groupDataList,
                    render: {
                        item: function (item, escape) {
                            selectedGroupParentItem = [];
                            selectedGroupParentItem.push({
                                "name": item.groupname,
                                "type": "group",
                                "value": item.groupKey
                            })
                            return (
                                "<div data-value='" + item.groupKey + "' data-type='group' class='p-1'>" + item.groupname + "</div>"
                            );
                        },
                        option: function (item, escape) {
                            return (
                                "<div value='" + item.groupKey + "' data-type='group' class='p-1'>" + item.groupname + "</div>"
                            );
                        },
                    }
                });
            }
            else if (type == "share") {
                $("#_listGroupForShare").selectize({
                    persist: false,
                    valueField: "groupKey",
                    labelField: "groupname",
                    searchField: ["groupname"],
                    sortField: "groupname",
                    closeAfterSelect: true,
                    create: false,
                    placeholder: "Select group to share",
                    options: result.groupDataList,
                    render: {
                        item: function (item, escape) {
                            $("._listUsersGroupToShare").append("<li class='list-group-item d-flex align-items-center justify-content-between' data-key='" + item.groupKey + "'><div>" + item.groupname + " <span class='_axpRights badge'></span> <br><span class='text-italic text-muted'>Group</span></div><div><button class='btn btn-falcon-default dropdown-toggle btn-sm' type='button' data-bs-toggle='dropdown' aria-haspopup='true' aria-expanded='false'><i class='fas fa-cog'></i></button><div class='dropdown-menu dropdown-menu-end py-0' aria-labelledby='dropdownMenuButton'><a class='dropdown-item' href='javascript:void(0)' onclick=setAccessRightsForFileFolder(this) data-value='View only'>View only</a><a class='dropdown-item' href='javascript:void(0)' data-value='Editor' onclick=setAccessRightsForFileFolder(this)>Editor</a><a class='dropdown-item' href='javascript:void(0)'  onclick=setAccessRightsForFileFolder(this) data-value='Owner' >Owner</a><div class='dropdown-divider'></div><a class='dropdown-item text-danger' href='javascript:void(0)' onclick=_removeUserGroupFromSharing(this)>Remove</a></div></div></li>");
                            return (
                                "<div data-value='" + item.groupKey + "' data-type='group' class='p-1'>" + item.groupname + "</div>"
                            );
                        },
                        option: function (item, escape) {
                            return (
                                "<div value='" + item.groupKey + "' data-type='group' class='p-1'>" + item.groupname + "</div>"
                            );
                        },
                    }
                });
            }
            else {
                var mParent = "";
                if (pfid == "0") {
                    if (result.groupDataList.length > 0) {
                        $.each(result.groupDataList, function (i, e) {
                            mParent += "<li class='treeview-list-item' id='" + e.uniqueKey + "' data-key='" + e.groupKey + "' data-index='" + i + "'>\
                            <a data-bs-toggle='collapse' data-unique='"+ e.uniqueKey + "' href='javascript:void(0)'  onclick=accessItem(this) role='button' aria-expanded='false'  data-type='group' data-item='" + e.groupname + "' class='noarrow noicon'>\
                                <p class='treeview-text'><i class='fas fa-users'></i> "+ e.groupname + "</p>\
                            </a>\
                            </li>";
                        })
                    } else {
                        mParent += "<li class='treeview-list-item'>No groups</li>"
                    }
                    $("#BS-group-folders").html(mParent);
                    $(".treeview-list-item a").unbind("click");
                    $(".treeview-list-item a").click(function (e) {
                        e.preventDefault();
                        var key = $(e.target).parent().attr("data-key");
                        var id = $(e.target).attr("data-unique");
                        getPersonalFolders(key, id);
                    });
                } else {
                    var subChild = "<ul class='collapse treeview-list show' id='" + id.replace("#", "") + "'>";
                    $.each(result.groupDataList, function (i, e) {
                        subChild += "<li class='treeview-list-item' id='" + e.uniqueKey + "' data-key='" + e.groupKey + "' data-index='" + i + "' >\
                                    <a data-bs-toggle='collapse' data-unique='"+ e.uniqueKey + "' href='javascript:void(0)'  onclick=accessItem(this) role='button' aria-expanded='false'  data-type='personal' data-item='" + e.groupname + "'>\
                                      <p class='treeview-text'>"+ e.groupname + "</p>\
                                    </a>\
                                  </li>";
                    })
                    subChild += "</ul>";

                    $("#" + id).find("ul").html(subChild).attr("class", "collapse treeview-list show " + id + "'");
                    $(".treeview-list-item a").unbind("click");
                    $(".treeview-list-item a").click(function (e) {
                        e.preventDefault();
                        var key = $(e.target).parent().attr("data-key");
                        var id = $(e.target).attr("data-unique");
                        getPersonalFolders(key, id);
                    });
                }
                treeviewInit();
            }
        }
        else {
            bascrmShowErrorMessage("danger", "fa-check-circle", "2000", "Some error occurred, please try again!", "");
        }
    });

}

function GetBasDriveLocalDriveList() {

    var param = {
        "userKey": $("#common_aKey").val(),
        "deviceInfo": device
    }
    getCommonData("bascrmbasdrive/GetBasDriveLocalDriveList", param, "new", function (result) {
        if (result.status) {
            //console.log(result);
            var mParent = "";

            if (result.localDriveDataList.length > 0) {
                $.each(result.localDriveDataList, function (i, e) {
                    mParent += "<li class='treeview-list-item' id='" + e.uniqueKey + "' data-key='" + e.driveKey + "' data-drive-type='" + e.drive_type + "' data-index='" + i + "'>\
                                <a data-bs-toggle='collapse' href='#"+ e.drive_name.replace(/ /g, "") + "'  onclick='accessItem(this)' data-item='" + e.drive_name + "' data-type='localdrive'  role='button' aria-expanded='false' class='noarrow noicon'>\
                                  <p class='treeview-text'>\
                                      <i class='fas fa-hdd'></i>\
                                      "+ e.drive_name + "</p>\
                                </a>\
                              </li>";
                })
                $("#BD-external-drive-folders").html(mParent);
            }

            //treeviewInit();

        } else {
            bascrmShowErrorMessage("danger", "fa-check-circle", "2000", "Some error occurred, please try again!", "");
        }
    });

}

function GetBasDriveSystemFolderList() {
    var param = {
        "userKey": $("#common_aKey").val(),
        "deviceInfo": device
    }
    getCommonData("bascrmbasdrive/GetBasDriveSystemFolderList", param, "new", function (result) {
        if (result.status) {
            //console.log(result);
            var mParent = "";

            if (result.systemFolderDataList.length > 0) {
                $.each(result.systemFolderDataList, function (i, e) {
                    mParent += "<li class='treeview-list-item' id='" + e.uniqueKey + "' data-key='" + e.folderKey + "' data-index='" + i + "'>\
                                <a data-bs-toggle='collapse' href='#"+ e.groupname.replace(/ /g, "") + "'  onclick='accessItem(this)' data-item='" + e.groupname + "' data-type='system'  role='button' aria-expanded='false' class='noarrow noicon'>\
                                  <p class='treeview-text'>\
                                      <i class='fas fa-hdd'></i>\
                                      "+ e.groupname + "</p>\
                                </a>\
                              </li>";
                })
                $("#BD-system-folders").html(mParent);
            }
            //treeviewInit();
        } else {
            bascrmShowErrorMessage("danger", "fa-check-circle", "2000", "Some error occurred, please try again!", "");
        }
    });
}

function GetBasDriveFileVersionList(e) {
    var existingEle = $(e).closest(".drive-item").next(".file-versions");
    if (existingEle.length > 0) {
        existingEle.remove();
    }
    else {
        var k = $(e).attr("data-key");
        var param = {
            "userKey": $("#common_aKey").val(),
            "deviceInfo": device,
            "docKey": k
        }
        getCommonData("bascrmbasdrive/GetBasDriveFileVersionList", param, "new", function (result) {
            if (result.status) {
                //console.log(result);
                var table = "<div class='file-versions'>";
                if (result.fileVersionList.length > 0) {
                    $.each(result.fileVersionList, function (i, f) {
                        createNestedRow(f, function (result) {
                            table += result;
                        })
                    })
                    table += "</div>"
                    $(".file-versions").remove();
                    $(table).insertAfter($(e).closest(".drive-item"));
                    bindFileVersionListActions();
                    glightboxInit();
                    //$(e).closest(".drive-item")
                    //tooltipInit();
                }
                //treeviewInit();
            } else {
                bascrmShowErrorMessage("danger", "fa-check-circle", "2000", "Some error occurred, please try again!", "");
            }
        });
    }
}


function GetBasDriveFileFolderShareDetails(e) {
    var k = $(e).closest(".drive-item").attr("data-key");
    var t = $(e).closest(".drive-item").attr("data-type");

    sharePanelDocKey = k;
    sharePanelDocType = t;

    var param = {
        "userKey": $("#common_aKey").val(),
        "deviceInfo": device,
        "docKey": k,
        "docType": t
    }
    getCommonData("bascrmbasdrive/GetBasDriveFileFolderShareDetails", param, "new", function (result) {
        if (result.status) {
            //console.log(result);
            var table = "<div class='file-share'><table class='table table-hover'><thead class='bg-soft-dark'><tr><th><span class='trn'>Member</span></th><th class='text-center'><span class='trn'>Download</span></th><th class='text-center'><span class='trn'>Share</span></th><th class='text-center'><span class='trn'>E-mail</span></th><th class='text-center'><span class='trn'>View</span></th><th class='text-center'><span class='trn'>Version</span></th><th class='text-center'><span class='trn'>Delete</span></th><th><span class='trn'>Shared dt</span></th><th></th></tr></thead><tbody>";
            if (result.fileFolderShareDetails.length > 0) {
                $.each(result.fileFolderShareDetails, function (i, f) {
                    var isViewEnable = "<i class='far fa-times-circle'></i>";
                    var isDownloadEnable = "<i class='far fa-times-circle'></i>";
                    var isShareEnable = "<i class='far fa-times-circle'></i>";
                    var isVersionEnable = "<i class='far fa-times-circle'></i>";
                    var isDeleteEnable = "<i class='far fa-times-circle'></i>";
                    var isEmailEnable = "<i class='far fa-times-circle'></i>";
                    //delete,read,share,readwrite
                    if (f.rights.includes("delete")) {
                        isDeleteEnable = "<i class='far fa-check-circle'></i>";
                    }
                    if (f.rights.includes("read")) {
                        isViewEnable = "<i class='far fa-check-circle'></i>";
                    }
                    if (f.rights.includes("share")) {
                        isShareEnable = "<i class='far fa-check-circle'></i>";
                    }
                    if (f.rights.includes("readwrite")) {
                        isViewEnable = "<i class='far fa-check-circle'></i>";
                        isDownloadEnable = "<i class='far fa-check-circle'></i>";
                        isVersionEnable = "<i class='far fa-check-circle'></i>";
                        isEmailEnable = "<i class='far fa-check-circle'></i>";
                    }
                    table += "<tr><td>" + f.name + "<br><small class='fs--1 text-muted'>" + f.email + "</small></td><td class='fs-2 text-center'>" + isDownloadEnable + "</td><td class='fs-2 text-center'>" + isShareEnable + "</td><td class='fs-2 text-center'>" + isEmailEnable + "</td><td class='fs-2 text-center'>" + isViewEnable + "</td><td class='fs-2 text-center'>" + isVersionEnable + "</td><td class='fs-2 text-center'>" + isDeleteEnable + "</td><td>" + moment(f.dt).format(CONFIG.dateformat) + "</td><td><a href='javascript:void(0)' class='btn btn-falcon-default btn-sm _btnStopFileSharingWithUser' data-bs-toggle='tooltip' data-bs-placement='top' title='Stop sharing' data-email='" + f.email + "'><i class='fas fa-times'></i></a></td></tr>";
                })
                table += "</tbody></table></div>"
                $("#_share-options-info .offcanvas-body").html(table);
                $("#_share-options-info-title").html("Sharing details");
                $("#_share-options-info").offcanvas("show").addClass("w-75");
                //tooltipInit();

                $("._btnStopFileSharingWithUser").unbind("click");
                $("._btnStopFileSharingWithUser").each(function () {
                    $(this).click(function () {
                        var email = $(this).attr("data-email");
                        _removeBasDriveSharedDocumentMember(sharePanelDocKey, sharePanelDocType, email, function (res) {
                            console.log(res);
                        })
                    })
                })
            }
            //treeviewInit();
        } else {
            bascrmShowErrorMessage("danger", "fa-check-circle", "2000", "Some error occurred, please try again!", "");
        }
    });
}

function createNestedRow(f, callback) {
    var table = "";

    var isLightBox = "", imgPreview = "", previewPath = "", editPath = "", target = "";
    var ext = f.athname.split('.').pop();
    if (filetypeEdit.split(',').indexOf("." + ext) > -1) {
        previewPath = createDocumentViewPath(f.athname, f.fileFullPath, f.hasnewserver, "view");
        editPath = createDocumentViewPath(f.athname, f.fileFullPath, f.hasnewserver, "edit");
        target = "target='_blank'";
    } else if (fileTypeImage.split(',').indexOf("." + ext) > -1) {
        previewPath = f.fileFullPath;
        isLightBox = "data-gallery='gallery-image'";
        imgPreview = "<img class='img-fluid rounded d-none' src='" + f.fileFullPath + "' alt='' />";

    } else if (fileTypeVideo.split(',').indexOf("." + ext) > -1) {
        previewPath = f.fileFullPath;
        isLightBox = "data-gallery='gallery-video'";
        imgPreview = "<video class='img-fluid rounded d-none' src='" + f.fileFullPath + "' alt='' ></video>";
    } else if (fileTypeAudio.split(',').indexOf("." + ext) > -1) {
        previewPath = f.fileFullPath;
        isLightBox = "data-gallery='gallery-audio'";
        imgPreview = "<video class='img-fluid rounded d-none' src='" + f.fileFullPath + "' alt='' ></video>";
    }

    if (f.athname != undefined) {
        var ext = f.athname.split('.').pop();
    }
    var editBtn = "";
    if (editPath.length > 0) {
        editBtn = "<a href='" + editPath + "' " + target + " data-action='file-edit' class='btn btn-falcon-default btn-sm fs--1 p-2 pt-0 pb-0' type='button' data-bs-toggle='tooltip' data-bs-placement='top' title='Edit file'><span class='fas fa-pencil-alt'></span></a>";
    }

    var previewBtn = "";
    if (previewPath.length > 0) {
        previewBtn = "<a href='" + previewPath + "' " + target + " " + isLightBox + " data-action='file-preview' class='btn btn-falcon-default btn-sm fs--1 p-2 pt-0 pb-0 drive-item-version-action' type='button' data-bs-toggle='tooltip' data-bs-placement='top' title='Preview file'><span class='fas fa-eye'></span>" + imgPreview + "</a>";
    }

    //console.log(f.share);
    if (f.icon != undefined) {
        if (f.icon == "") {
            if (f.typeofobject == "Folder") {
                fIcon = "<i class='fas fa-folder'></i>";
            }
        } else {
            fIcon = "<img class='rounded-soft' src='" + f.icon.replace("/images/", "/assets/img/") + "' alt='' />";
        }
    } else {
        fIcon = "<i class='fas fa-folder'></i>";
    }

    // here type will be fileversion always (folder and group not allowed versions)
    table += "<div class='table-row drive-item-version row border-bottom border-200 hover-actions-trigger hover-shadow py-2 px-1 mx-0 bg-white dark__bg-dark fs--1 bg-soft-secondary' data-key='" + f.docKey + "' data-type='fileversion' data-parent-type='" + f.type.toLowerCase() + "'>\
                <div class='col-lg-1 d-none d-sm-block _col_auto_firt'>\
                  <div class='d-flex bg-white dark__bg-dark'>\
                  </div>\
                </div>\
                <div class='col col-lg-9 col-xxl-9 _col_auto_second'>\
                  <div class='row'>\
                    <div class='col-lg-6 ps-md-0 mb-1 mb-md-0'>\
                      <div class='d-flex position-relative align-items-center'>\
                        <div class='avatar avatar-s'>\
                         "+ fIcon + "\
                        </div>\
                        <div class='d-flex ms-2'><a class='stretched-link inbox-link _file_name_main' href='javascript:void(0)'>"+ f.athname + "</a> <div class='btn-group z-index-2 hover-actions _file_action_buttons_hover end-0'><button id='btn_fileversion_copylink' class='btn btn-falcon-default btn-sm fs--1 p-2 pt-0 pb-0' type='button' data-bs-toggle='tooltip' data-bs-placement='top' data-type='unique-url' title='Copy link'><span class='fas fa-copy'></span> Copy link</button></div></div>\
                      </div>\
                    </div>\
                     <div class='col-lg-4'> <div class='btn-group z-index-2 hover-actions _file_action_buttons_hover'>\
                     "+ editBtn + " " + previewBtn + "\
                    <a href='javascript:void(0)' data-action='file-share' class='btn btn-falcon-default btn-sm fs--1 p-2 pt-0 pb-0 drive-item-version-action' type='button' data-bs-toggle='tooltip' data-bs-placement='top' title='Share file'><span class='fas fa-share-alt'></span></a>\
                    <a href='javascript:void(0)' data-action='file-email' class='btn btn-falcon-default btn-sm fs--1 p-2 pt-0 pb-0 drive-item-version-action' type='button' data-bs-toggle='tooltip' data-bs-placement='top' title='E-mail file'><span class='fas fa-envelope'></span></a>\
                    <a href='javascript:void(0)' data-action='file-download' class='btn btn-falcon-default btn-sm fs--1 p-2 pt-0 pb-0 drive-item-version-action' type='button' data-bs-toggle='tooltip' data-bs-placement='top' title='Download file' data-downloadpath='"+ f.downloadPath + "'><span class='fas fa-download'></span></a>\
                    <a href='javascript:void(0)' data-action='file-delete' class='btn btn-falcon-default btn-sm fs--1 p-2 pt-0 pb-0 drive-item-version-action' type='button' data-bs-toggle='tooltip' data-bs-placement='top' title='Delete file'><span class='fas fa-trash'></span></a>\
                    <a href='javascript:void(0)' data-action='file-info' class='btn btn-falcon-default btn-sm fs--1 p-2 pt-0 pb-0 drive-item-version-action' type='button' data-bs-toggle='tooltip' data-bs-placement='top' title='File info'><span class='fas fa-info-circle'></span></a>\
                    </div>\
                    </div>\
                    <div class='col-lg-2 text-start p-0 d-none d-sm-block'>"+ f.size + "</div>\
                  </div>\
                </div>\
                <div class='col-lg-2 ms-auto p-0 text-end d-flex flex-column justify-content-between _col_dt'><span class='me-3 table-data'  data-bs-toggle='tooltip' data-bs-placement='top' title='Version by " + f.Name + "'>" + moment(f.updated).format(CONFIG.dateFormatWithShortDay) + "</span><span class='fas text-warning fa-star ms-auto mb-2 d-sm-none' data-fa-transform='down-7'></span></div>\
              </div>";
    //<a href='javascript:void(0)' data-action='file-version' class='btn btn-falcon-default btn-sm fs--1 p-2 pt-0 pb-0' type='button' data-bs-toggle='tooltip' data-bs-placement='top' title='Add new version'><span class='fas fa-plus'></span></a>\
    if (callback != null) {
        callback(table);
    }
}

function bindScrollLoadData() {
    //$(window).scroll(function () {
    //if (windowscrollfree && (parseInt($(window).scrollTop()) == ($(document).height() - $(window).height() - 1))) {
    ////if (($(window).scrollTop() + $(window).height()) == $(document).height()) {
    //    windowscrollfree = false;
    //    getDataListing(currentView, "WV6EZw7u36g=", accessurl, function (result) {
    //        if (currentView == "favorites") {
    //            callback(result);
    //        } else if (currentView == "trash") {
    //            callback(result);
    //        } else {
    //            callback(result);
    //        }
    //        console.log(result);
    //        windowscrollfree = true;
    //    })
    //}



    //});
}

function filterData() {
    var properties = [
        'filename',
        'foldername',
        'lastupdate'
    ];

    $.each(properties, function (i, val) {

        var orderClass = '';

        $("#" + val).click(function (e) {
            e.preventDefault();
            $('.filter__link.filter__link--active').not(this).removeClass('filter__link--active');
            $(this).toggleClass('filter__link--active');
            $('.filter__link').removeClass('asc desc');

            if (orderClass == 'desc' || orderClass == '') {
                $(this).addClass('asc');
                orderClass = 'asc';
            } else {
                $(this).addClass('desc');
                orderClass = 'desc';
            }

            var parent = $(this).closest('.header__item');
            var index = $(".header__item").index(parent);
            var $table = $('.table-content');
            var rows = $table.find('.table-row').get();
            var isSelected = $(this).hasClass('filter__link--active');
            var isNumber = $(this).hasClass('filter__link--number');

            rows.sort(function (a, b) {

                var x = $(a).find('.table-data').eq(index).text();
                var y = $(b).find('.table-data').eq(index).text();

                if (isNumber == true) {

                    if (isSelected) {
                        return x - y;
                    } else {
                        return y - x;
                    }

                } else {

                    if (isSelected) {
                        if (x < y) return -1;
                        if (x > y) return 1;
                        return 0;
                    } else {
                        if (x > y) return -1;
                        if (x < y) return 1;
                        return 0;
                    }
                }
            });

            $.each(rows, function (index, row) {
                $table.append(row);
            });

            return false;
        });

    });
}

function _BDFolder_Create(e) {
    $("#_driveFolder_new").offcanvas("show");
    $("#_txtFolderName").on('keyup', function (e) {
        if ($(this).val() != "") {
            $("#btnCreate").removeClass("btn-secondary").addClass("btn-success").removeClass("disabled");
        }
        if (e.keyCode == 8) {
            if ($(this).val() == "") {
                $("#btnCreate").addClass("btn-secondary").removeClass("btn-success").addClass("disabled");
            }
        }
    });
}

var folderHierarchySelectize = null;
function getFoldersHierarchy() {
    var param = {
        "userKey": $("#common_aKey").val(),
        "deviceInfo": device
    }
    getCommonData("bascrmbasdrive/GetBasDriveFolderHierarchyForCreateFolder", param, "new", function (result) {
        if (result.status) {
            //console.log(result);
            // var mParent = "<option value='0'>Select</option>";
            if (result.folderDataList.length > 0) {
                //$.each(result.folderDataList, function (i, e) {
                //    mParent += "<option value='" + e.folderKey + "' data-type='" + e.type + "'>" + e.name + "</option>";
                //})
                //$("#_ddlParentFolder").html(mParent);
                //$("#_ddlParentFolder").selectize({
                //    persist: false,
                //    create: false,
                //    sortField: "text",
                //    closeAfterSelect: true
                //});
                folderHierarchySelectize = $("#_ddlParentFolder, #_ddlMoveToOptions, #_ddlParentGroupFolder, #_ddlCopyToOptions").selectize({
                    persist: false,
                    valueField: "folderKey",
                    labelField: "name",
                    searchField: ["name"],
                    sortField: "name",
                    closeAfterSelect: true,
                    create: false,
                    options: result.folderDataList,
                    render: {
                        item: function (item, escape) {
                            selectedParentItem = [];
                            selectedParentItem.push({
                                "name": item.name,
                                "type": item.type,
                                "value": item.folderKey
                            })
                            return (
                                "<div data-value='" + item.folderKey + "' data-type='" + item.type + "' class='p-1'>" + item.name + "</div>"
                            );
                        },
                        option: function (item, escape) {
                            return (
                                "<div value='" + item.folderKey + "' data-type='" + item.type + "' class='p-1'>" + item.name + "</div>"
                            );
                        },
                    }
                });
            }

            //treeviewInit();

        } else {
            bascrmShowErrorMessage("danger", "fa-check-circle", "2000", "Some error occurred, please try again!", "");
        }
    });
}

function resetFolderHierarchySelectize() {
    try {
        var control = folderHierarchySelectize[0].selectize;
        control.clear();
    } catch (e) { }
}

function createNewBD(e) {
    $(e).html("Creating...");
    var parentKey = "";
    var type = "";
    if (selectedParentItem.length == 0) {
        parentKey = "0";
        type = "personalfolder";
    } else {
        parentKey = selectedParentItem[0].value;
        type = selectedParentItem[0].type;
    }
    var param = {
        "userKey": $("#common_aKey").val(),
        "deviceInfo": device,
        "folderName": $("#_txtFolderName").val(),
        "parentKey": parentKey,
        "parentType": type
    }
    getCommonData("bascrmbasdrive/CreateBasDriveFolder", param, "new", function (result) {
        if (result.status) {
            $("#_driveFolder_new").offcanvas("hide");
            resetFolderHierarchySelectize();
            bascrmShowErrorMessage("success", "fa-check-circle", "2000", "Folder created successfully!", "");
            $(e).html("Create");
            selectedParentItem = [];
            $("#_txtFolderName").val("");
            $("#_rdOnlyMe").trigger("click");
            var res = [];
            res.push({
                "name": param.folderName,
                "key": result.folderKey,
                "type": type,
                "guid": result.lastRecordUniqueKey
            })
            accessItem("", res);
            getPersonalFolders("0", "");
        } else {
            bascrmShowErrorMessage("danger", "fa-check-circle", "2000", "Some error occurred, please try again!", "");
            $(e).html("Create");
        }
    });
}

function onlyMe(e) {
    $("#_sharewithusers").addClass("d-none");
}
function specifyUser(e) {
    getUserList(function (result) {
        $("#_sharewithusers").removeClass("d-none");
        $("#_ddlSpecifyUsers").selectize({
            persist: false,
            valueField: "UserKey",
            labelField: "Name",
            searchField: ["Name"],
            sortField: "Name",
            closeAfterSelect: true,
            create: false,
            options: result,
            render: {
                item: function (item, escape) {
                    $("#_sharewithusers").append("<label class='mt-3 w-100 d-block'>" + item.Name + " [" + item.Email + "]</label><div class='row g-3'><ul class='list-group'><li class='list-group-item d-flex justify-content-between align-items-start'><div class='ms-2 me-auto'><div class='fw-bold'>Read</div></div><span class=''><a href='javascript:void(0)' onclick=selectFolderUserRightsItem(this)><i class='fas fa-check-circle'></i></a></span></li><li class='list-group-item d-flex justify-content-between align-items-start'><div class='ms-2 me-auto'><div class='fw-bold'>Edit</div></div><span class=''><a href='javascript:void(0)' onclick=selectFolderUserRightsItem(this)><i class='fas fa-check-circle'></i></a></span></li><li class='list-group-item d-flex justify-content-between align-items-start'><div class='ms-2 me-auto'><div class='fw-bold'>Delete</div></div><span class=''><a href='javascript:void(0)' onclick=selectFolderUserRightsItem(this)><i class='fas fa-check-circle'></i></a></span></li><li class='list-group-item d-flex justify-content-between align-items-start'><div class='ms-2 me-auto'><div class='fw-bold'>Share</div></div><span class=''><a href='javascript:void(0)' onclick=selectFolderUserRightsItem(this)><i class='fas fa-check-circle'></i></a></span></li></ul></div>");
                    return (
                        "<div data-value='" + item.userKey + "' class='p-1'>" + item.Name + " [" + item.Email + "]</div>"
                    );

                },
                option: function (item, escape) {
                    return (
                        "<div data-value='" + item.userKey + "' class='p-1'>" + item.Name + " [" + item.Email + "]</div>"
                    );
                },
            }
        });
    })
}

function selectFolderUserRightsItem(e) {
    $(e).toggleClass("text-success");
}


var groupSelectizeControl = null;
function _BDGroup_Create(e) {
    //getGroupFolders("0", "", "create");
    $("#ul_selected_group_members li").remove();
    getUserList(function (result) {
        groupSelectizeControl = $("#_ddlAddUsers").selectize({
            persist: false,
            valueField: "UserKey",
            labelField: "Name",
            searchField: ["Name"],
            sortField: "Name",
            closeAfterSelect: true,
            maxItems: 1,
            create: false,
            options: result,
            render: {
                item: function (item, escape) {
                    //$("#_sharewithusers").append("<label class='mt-3 w-100 d-block'>" + item.Name + " [" + item.Email + "]</label><div class='row g-3'><ul class='list-group'><li class='list-group-item d-flex justify-content-between align-items-start'><div class='ms-2 me-auto'><div class='fw-bold'>Read</div></div><span class=''><a href='javascript:void(0)' onclick=selectFolderUserRightsItem(this)><i class='fas fa-check-circle'></i></a></span></li><li class='list-group-item d-flex justify-content-between align-items-start'><div class='ms-2 me-auto'><div class='fw-bold'>Edit</div></div><span class=''><a href='javascript:void(0)' onclick=selectFolderUserRightsItem(this)><i class='fas fa-check-circle'></i></a></span></li><li class='list-group-item d-flex justify-content-between align-items-start'><div class='ms-2 me-auto'><div class='fw-bold'>Delete</div></div><span class=''><a href='javascript:void(0)' onclick=selectFolderUserRightsItem(this)><i class='fas fa-check-circle'></i></a></span></li><li class='list-group-item d-flex justify-content-between align-items-start'><div class='ms-2 me-auto'><div class='fw-bold'>Share</div></div><span class=''><a href='javascript:void(0)' onclick=selectFolderUserRightsItem(this)><i class='fas fa-check-circle'></i></a></span></li></ul></div>");
                    return (
                        "<div data-value='" + item.userKey + "' class='p-1'>" + item.Name + " [" + item.Email + "]</div>"
                    );

                },
                option: function (item, escape) {
                    return (
                        "<div data-value='" + item.userKey + "' class='p-1'>" + item.Name + " [" + item.Email + "]</div>"
                    );
                },
            },
            onChange: function (value) {
                if (value.length > 0) {
                    var d = groupSelectizeControl[0].selectize.options[value];
                    createSelectedGroupMemberDiv(d, $("#ul_selected_group_members"));

                    //if ($("#ul_selected_group_members li[data-key='" + value + "']").length == 0) {
                    //    $("#ul_selected_group_members").append("<li class='list-group-item d-flex align-items-center justify-content-between' data-key='" + value + "' data-email='" + d.Email + "' data-username='" + d.Name + "'><div>" + d.Name + " <span class='_axpRights badge badge-soft-secondary' data-right='read'>View only</span> <br>" + d.Email + "</div><div><button class='btn btn-falcon-default dropdown-toggle btn-sm' type='button' data-bs-toggle='dropdown' aria-haspopup='true' aria-expanded='false'><i class='fas fa-cog'></i></button><div class='dropdown-menu dropdown-menu-end py-0' aria-labelledby='dropdownMenuButton'><a class='dropdown-item' href='javascript:void(0)' onclick=setAccessRightsForFileFolder(this) data-value='View only'>View only</a><a class='dropdown-item' href='javascript:void(0)' data-value='Editor' onclick=setAccessRightsForFileFolder(this)>Editor</a><a class='dropdown-item' href='javascript:void(0)'  onclick=setAccessRightsForFileFolder(this) data-value='Owner' >Owner</a><div class='dropdown-divider'></div><a class='dropdown-item text-danger' href='javascript:void(0)' onclick=_removeUserGroupFromSharing(this)>Remove</a></div></div></li>");
                    //}
                }
                resetGroupSelectizeControl();
            }
        });

        $("#_driveGroup_new").offcanvas("show");

        $("#_txtGroupName").on('keyup', function (e) {
            if ($(this).val() != "") {
                $("#btnCreateGroup").removeClass("btn-secondary").addClass("btn-success").removeClass("disabled");
            }
            if (e.keyCode == 8) {
                if ($(this).val() == "") {
                    $("#btnCreateGroup").addClass("btn-secondary").removeClass("btn-success").addClass("disabled");
                }
            }
        });
    })

}

function createNewBDGroup(e) {
    if ($.trim($("#_txtGroupName").val()).length > 0) {
        $(e).html("Creating...");
        //var parentKey = "";
        //var type = "";
        //if (selectedGroupParentItem.length == 0) {
        //    parentKey = "0";
        //} else {
        //    parentKey = selectedGroupParentItem[0].value;
        //}

        var groupMemberList = [];
        $.each($("#ul_selected_group_members li"), function (i, li) {
            groupMemberList.push({ "memberKey": $(li).attr("data-key"), "rights": $(li).find("._axpRights").attr("data-right") });
        });


        var param = {
            "userKey": $("#common_aKey").val(),
            "deviceInfo": device,
            "groupName": $.trim($("#_txtGroupName").val()),
            "groupMemberList": groupMemberList
            //"parentKey": parentKey
        }
        getCommonData("bascrmbasdrive/CreateBasDriveGroup", param, "new", function (result) {
            if (result.status) {
                $("#_driveGroup_new").offcanvas("hide");
                bascrmShowErrorMessage("success", "fa-check-circle", "2000", "Group created successfully!", "");
                $(e).html("Create");
                //selectedParentItem = [];
                $("#_txtGroupName").val("");
                $("#_rdOnlyMe").trigger("click");
                resetGroupSelectizeControl();
                $("#ul_selected_group_members li").remove();
                getGroupFolders("0");
                var res = [];
                res.push({
                    "name": param.groupName,
                    "key": result.groupKey,
                    "type": "group",
                    "guid": result.lastRecordUniqueKey
                })
                accessItem("", res);
                //getPersonalFolders("0", "");
            } else {
                bascrmShowErrorMessage("danger", "fa-check-circle", "2000", "Some error occurred, please try again!", result.errormessage);
                $(e).html("Create");
            }
        });
    }
    else {
        bascrmShowErrorMessage("danger", "fa-check-circle", "2000", "Group name can not be empty!", "");
    }
}

function resetGroupSelectizeControl() {
    try {
        var control = groupSelectizeControl[0].selectize;
        control.clear();
    } catch (e) { }
}

function moveDriveItems(e, doclist, allowRenameExisting) {
    $(e).html("Moving...");

    if (selectedParentItem.length > 0) {
        //var docs = "";
        //$.each(isCheckedItemDrive, function (i, d) {
        //    if (docs == "") {
        //        docs = d.documentKey;
        //    } else {
        //        docs += "," + d.documentKey;
        //    }
        //});
        if (doclist == undefined || doclist == null || doclist == "") {
            doclist = getSelectedDocumentsList();
        }
        if (allowRenameExisting == undefined || allowRenameExisting == null || allowRenameExisting == "") {
            allowRenameExisting = "0";
        }

        var allValid = true;
        const index = doclist.findIndex(x => x.documentType == "folder" && x.flagType != "folder");
        if (index > -1) {
            allValid = false;
            bascrmShowErrorMessage("danger", "fa-times", "2500", "Groups can not be move", "");
            $(e).html("Move");
            return false;
        }

        if (allValid) {
            var param = {
                "userKey": $("#common_aKey").val(),
                "deviceInfo": device,
                "targetType": selectedParentItem[0].type,
                "targetKey": selectedParentItem[0].value,
                "documentList": doclist,
                "allowRenameExisting": allowRenameExisting
                //"docKeys": docs
            }
            getCommonData("bascrmbasdrive/MoveBasDriveDocument", param, "new", function (result) {
                if (result.status) {
                    if (result.existingDocumentList && result.existingDocumentList.length > 0) {
                        $("#move-copy-alreadyexist-div ._title").html("Action required");
                        $("#move-copy-alreadyexist-div ._subTitle").html("Some files already exist in folder <b>" + result.targetPath + "</b>");
                        var exData = "";
                        $.each(result.existingDocumentList, function (i, k) {
                            exData += "<div class='d-flex align-items-center justify-content-between fs--1 mb-2 _drive-exist-row' data-key='" + k.documentKey + "' data-type='" + k.documentType + "' data-flag-type='" + k.flagType + "' data-name='" + k.documentName + "'><span>" + k.documentType + " (" + k.documentName + ") already exist in the destination</span> <span><a href='javascript:void(0)' class='_linkMoveExistCopy'>Make a copy</a> | <a href='javascript:void(0)' class='_linkMoveExistSkip'>Skip</a></span></div>";
                        })
                        $("#move-copy-alreadyexist-div ._body").html(exData);

                        $("#move-copy-alreadyexist-div").modal("show");
                        $(e).html("Move");

                        $("._linkMoveExistCopy").unbind("click");
                        $("._linkMoveExistCopy").each(function () {
                            $(this).click(function () {
                                var key = $(this).closest("._drive-exist-row").attr("data-key");
                                var dataType = $(this).closest("._drive-exist-row").attr("data-type");
                                var dataFlagType = $(this).closest("._drive-exist-row").attr("data-flag-type");
                                var dataName = $(this).closest("._drive-exist-row").attr("data-name");

                                //var arrayListOfObj = [];
                                ////$("#_selectedFolderFoldersList ul li.dropdown-item").each(function (i, li) {
                                //arrayListOfObj.push({ "documentKey": key, "documentType": dataType, "flagType": (dataFlagType == "recent" ? "file" : dataFlagType) });
                                //});
                                moveDriveItems("", result.documentList, "1");
                            });
                        });

                    }
                    else {
                        $("#_driveGroup_new").offcanvas("hide");
                        bascrmShowErrorMessage("success", "fa-check-circle", "2000", "Successfully moved!", "");
                        $(e).html("Move");
                        selectedParentItem = [];
                        $("#itemListDriveForMove").html("");
                        //$("#_driveMove").offcanvas("hide");
                        $("._checked_actions_ ._itemLis").html("");
                        $("._checked_actions_").attr("style", "display:none;");
                        resetDocumentSelection();
                        loadDriveDataWithHeader(currentView, "0", currentView, accessurl);
                    }

                    $("#_driveMove").offcanvas("hide");
                    $("#move-copy-alreadyexist-div").modal("hide");
                }
                else {
                    bascrmShowErrorMessage("danger", "fa-check-circle", "2000", "Some error occurred, please try again!", "");
                    $(e).html("Move");
                }
            });
        }
    } else {
        bascrmShowErrorMessage("danger", "fa-check-circle", "2000", "Select a folder to move!", "");
        $(e).html("Move");
    }
}

function copyDriveItems(e, doclist, allowRenameExisting) {
    $(e).html("Copying...");

    if (selectedParentItem.length > 0) {
        if (doclist == undefined || doclist == null || doclist == "") {
            doclist = getSelectedDocumentsList();
        }
        if (allowRenameExisting == undefined || allowRenameExisting == null || allowRenameExisting == "") {
            allowRenameExisting = "0";
        }
        var allValid = true;
        const index = doclist.findIndex(x => x.documentType == "folder" && x.flagType != "folder");
        if (index > -1) {
            allValid = false;
            bascrmShowErrorMessage("danger", "fa-times", "2500", "Groups can not be copy", "");
            $(e).html("Copy");
            return false;
        }


        if (allValid) {
            var param = {
                "userKey": $("#common_aKey").val(),
                "deviceInfo": device,
                "targetType": selectedParentItem[0].type,
                "targetKey": selectedParentItem[0].value,
                "documentList": doclist,
                "allowRenameExisting": allowRenameExisting
                //"docKeys": docs
            }
            getCommonData("bascrmbasdrive/CopyBasDriveDocument", param, "new", function (result) {
                if (result.status) {
                    //if (result.existingDocumentList.length > 0) {
                    //    $("#move-copy-alreadyexist-div ._title").html("Action required");
                    //    $("#move-copy-alreadyexist-div ._subTitle").html("Some files already exist in folder <b>" + result.targetPath + "</b>");
                    //    var exData = "";
                    //    $.each(result.existingDocumentList, function (i, k) {
                    //        exData += "<div class='d-flex align-items-center justify-content-between fs--1 mb-2 _drive-exist-row' data-key='" + k.documentKey + "' data-type='" + k.documentType + "' data-flag-type='" + k.flagType + "' data-name='" + k.documentName + "'><span>" + k.documentType + " (" + k.documentName + ") already exist in the destination</span> <span><a href='javascript:void(0)' class='_linkMoveExistCopy'>Make a copy</a> | <a href='javascript:void(0)' class='_linkMoveExistSkip'>Skip</a></span></div>";
                    //    })
                    //    $("#move-copy-alreadyexist-div ._body").html(exData);

                    //    $("#move-copy-alreadyexist-div").modal("show");
                    //    $(e).html("Copy");

                    //    $("._linkMoveExistCopy").unbind("click");
                    //    $("._linkMoveExistCopy").each(function () {
                    //        $(this).click(function () {
                    //            var key = $(this).closest("._drive-exist-row").attr("data-key");
                    //            var dataType = $(this).closest("._drive-exist-row").attr("data-type");
                    //            var dataFlagType = $(this).closest("._drive-exist-row").attr("data-flag-type");
                    //            var dataName = $(this).closest("._drive-exist-row").attr("data-name");

                    //            var arrayListOfObj = [];
                    //            //$("#_selectedFolderFoldersList ul li.dropdown-item").each(function (i, li) {
                    //            arrayListOfObj.push({ "documentKey": key, "documentType": dataType, "flagType": (dataFlagType == "recent" ? "file" : dataFlagType) });
                    //            //});
                    //            moveDriveItems("", arrayListOfObj, "1");
                    //        });
                    //    });

                    //}
                    //else {
                    $("#_driveGroup_new").offcanvas("hide");
                    bascrmShowErrorMessage("success", "fa-check-circle", "2000", "Successfully copied!", "");
                    $(e).html("Copy");
                    selectedParentItem = [];
                    $("#itemListDriveForMove").html("");
                    $("#_driveCopy").offcanvas("hide");
                    $("._checked_actions_ ._itemLis").html("");
                    $("._checked_actions_").attr("style", "display:none;");
                    resetDocumentSelection();
                    loadDriveDataWithHeader(currentView, "0", currentView, accessurl);
                    // }

                } else {
                    bascrmShowErrorMessage("danger", "fa-check-circle", "2000", "Some error occurred, please try again!", "");
                    $(e).html("Copy");
                }
            });
        }
    } else {
        bascrmShowErrorMessage("danger", "fa-check-circle", "2000", "Select a folder to move!", "");
        $(e).html("Copy");
    }
}

function getUniqueURL(e) {
    var arrayListOfObj = [];
    var type = $(e).attr("data-type");
    if (type == "unique-url") {
        var key = $(e).closest(".table-row").attr("data-key");
        var type = $(e).closest(".table-row").attr("data-type");
        var flagType = $("._pnl_path_file").attr("data-parent-type");
        if (flagType == "common") {
            flagType = "file";
        }

        if (type.toLowerCase() == "file") {
            flagType = "file";
        }
        arrayListOfObj.push({ "documentKey": key, "documentType": type, "flagType": flagType });
    }
    else {
        var array = $("#_selectedFolderFoldersList ._itemLis li");
        $.each(array, function (i, k) {
            var key = $(k).attr("data-key");
            var type = $(k).attr("data-type");

            var flagType = $(k).attr("data-parent-type");
            if (flagType == "common") {
                flagType = "file";
            }

            if (type.toLowerCase() == "file") {
                flagType = "file";
            }
            arrayListOfObj.push({ "documentKey": key, "documentType": type, "flagType": flagType });
        })
    }

    var param = {
        "userKey": $("#common_aKey").val(),
        "deviceInfo": device,
        "documentList": arrayListOfObj
    }
    getCommonData("bascrmbasdrive/GetBasDriveDocumentUniqueUrl", param, "new", function (result) {
        if (result.status) {
            //console.log(result);
            var copyText = result.uniqueUrl;

            // Select the text field
            //copyText.select();
            //copyText.setSelectionRange(0, 99999); // For mobile devices

            // Copy the text inside the text field
            navigator.clipboard.writeText(copyText);

            // Alert the copied text
            //alert("Copied the text: " + copyText);
            bascrmShowErrorMessage("success", "fa-check-circle", "3000", "File successfully copyed to clipboard, text coppied <br><em class='fs--1'>" + copyText + "</em>", "");

            $("[data-action='unique-link-multiple']").html("Generate unique link");
            resetDocumentSelection();
            //$("._itemCheck").prop("checked", false).removeClass("checked");
            //$("#_selectedFolderFoldersList ._itemLis li").remove();
            //$("._checked_actions_").hide();
            //isCheckedItemDrive = [];
            //$("#_selectedFileForLink").html(isCheckedItemDrive.length + " selected");
        } else {
            bascrmShowErrorMessage("danger", "fa-check-circle", "2000", "Some error occurred, please try again!", "");
            $(e).html("Create");
        }
    });
}

function getfileFolderInfo(e, callback) {
    var key = $(e).attr("data-key");
    var type = $(e).attr("data-type");
    var param = {
        "userKey": $("#common_aKey").val(),
        "deviceInfo": device,
        "docKey": key,
        "docType": type
    }
    getCommonData("bascrmbasdrive/GetBasDriveDocumentInformation", param, "new", function (result) {
        if (result.status) {
            if (callback != null) {
                callback(result);
            }
        } else {
            bascrmShowErrorMessage("danger", "fa-check-circle", "2000", "Some error occurred, please try again!", "");
            $(e).html("Create");
        }
    });
}

function removeFileFolder(ele, callback) {
    var key = ele.attr("data-key");
    var type = ele.attr("data-type");
    var flagType = ele.attr("data-parent-type");
    var d = null;
    if ($(".drive-item ._itemCheck:checked").length == 0) {
        d = {};
        d.docKey = key;
        d.docType = type;
        d.flagType = flagType;
    }

    var param = {
        "userKey": $("#common_aKey").val(),
        "deviceInfo": device,
        "isEmptyFolder": "0",
        "documentList": getSelectedDocumentsList(d)
    }
    getCommonData("bascrmbasdrive/RemoveBasDriveDocument", param, "new", function (result) {
        if (callback != null) {
            callback(result);
        }
    });
}

function PreviewDriveFile(e, callback) {
    var key = $(e).closest(".table-row").attr("data-key");
    var param = {
        "userKey": $("#common_aKey").val(),
        "deviceInfo": device,
        "docKey": key
    }
    getCommonData("bascrmbasdrive/GetBasDriveDocumentFileDataUrl", param, "new", function (result) {
        if (callback != null) {
            callback(result);
        }
    });
}

function compressDownload(ele, callback) {
    var d = null;
    if ($(".drive-item ._itemCheck:checked").length == 0) {
        d = {};
        d.docKey = ele.closest(".drive-item").attr("data-key");
        d.docType = ele.closest(".drive-item").attr("data-type");
        d.flagType = ele.closest(".drive-item").attr("data-parent-type");
    }

    var param = {
        "userKey": $("#common_aKey").val(),
        "deviceInfo": device,
        "documentList": getSelectedDocumentsList(d)
        //"docKeys": keys
    }
    getCommonData("bascrmbasdrive/CreateBasDriveDocumentZip", param, "new", function (result) {
        if (callback != null) {
            bascrmShowErrorMessage("success", "fa-spinner fa-spin", "1500", "Downloading....", "");
            callback(result);
        }
    });
}

function _finishSharingFilesFolders() {

    //var sharingFileList = $("._listFilesFoldersToShare ul li");    

    var allValid = true;

    // get document list
    var documentList = [];
    $.each($("._listFilesFoldersToShare li"), function (i, li) {
        if ($(li).attr("data-type") == "folder" && $(li).attr("data-parent-type") != "folder") {
            allValid = false;
            bascrmShowErrorMessage("danger", "fa-times", "2500", "Groups can not be share", "");
            $("[data-action='finish-sharing']").html("Save");
            return false;
        }
        else {
            documentList.push({ "documentKey": $(li).attr("data-key"), "documentType": $(li).attr("data-type"), "flagType": ($(li).attr("data-parent-type") == "recent" ? "file" : $(li).attr("data-parent-type")) });
        }
    });

    if (allValid) {

        // get member list
        var documentShareToList = [];
        $.each($("._listUsersGroupToShare li"), function (j, u) {
            documentShareToList.push({
                //"itemType": "user",
                "memberKey": $(u).attr("data-key"),
                "memberEmail": $(u).attr("data-email"),
                //"name": $(u).attr("data-username"),
                //"smsEnable": "0",
                //"smsNumber": "",
                "rights": $(u).find("span._axpRights").attr("data-right")
            });
        });

        var expiryType = "never";
        if ($("#_chkExpireSecureDriveAccess").prop("checked")) {
            expiryType = "custom";
        }
        var param = {
            "userKey": $("#common_aKey").val(),
            "deviceInfo": device,
            "documentList": documentList,
            //"documentKeys": documentKeys,
            //"documentType": "file",
            //"shareType": "User",
            "isPasswordEnable": ($("#_chkPasswordSecureDriveAccess").is(":checked") ? "1" : "0"),
            "password": $("._securityPasswordForAccess").val(),
            "isExpiryEnable": ($("#_chkExpireSecureDriveAccess").is(":checked") ? "1" : "0"),
            //"expiryType": expiryType,
            "expiryDate": $("._expirySharingDate").val(),
            "documentShareToList": documentShareToList,
            "message": $("._textareaCustomSharingMessage").val()
        }
        console.log(param);
        //return null;
        getCommonData("BascrmBasdrive/ShareBasDriveDocument", param, "new", function (result) {
            if (result.status) {
                console.log(result);
                $("._listFilesFoldersToShare").html("");
                $("._listUsersGroupToShare").html("");
                $("#_chkExpireSecureDriveAccess, #_chkPasswordSecureDriveAccess").trigger("change");
                $("#_shareMyFileFolders").offcanvas("hide");
                isCheckedItemDrive = [];

                $("._listFilesFoldersToShare ul, ._listUsersGroupToShare").html("");
                $("#_chkPasswordSecureDriveAccess, #_chkExpireSecureDriveAccess").prop("checked", false);
                $("._textareaCustomSharingMessage").val("");
                $("._securityPasswordForAccess, ._expirySharingDate").val("").attr("disabled", "disabled");
                $("._btnGeneratePasswordForSharing").attr("disabled", "disabled").addClass("d-none");
                // updated by VIJAY
                resetDocumentSelection();
                //var grid = $("#_otherTabItems .drive-item");
                //$.each(grid, function (i, k) {
                //    $(k).find("._itemCheck").prop("checked", false).removeClass("checked");
                //})

                //userControl.clear();
            } else {
                bascrmShowErrorMessage("danger", "fa-times", "2500", "Some error, Please try again!", result.errormessage);
            }
            $("[data-action='finish-sharing']").html("Save");
        });
    }
}

function checkIfBasDriveFileExist(name, folder, folderKey, docType, callback) {
    var param = {
        "userKey": $("#common_aKey").val(),
        "deviceInfo": device,
        "parentKey": folderKey,
        "parentType": folder,
        "fileName": name,
        "docType": docType
    }

    getCommonData("BascrmBasdrive/CheckBasDriveDocumentAlreayExistOrNot", param, "new", function (result) {
        if (result.status) {
            if (callback != null) {
                callback(result);
            }
        }
        else {
            if (callback != null) {
                callback(null);
            }
        }
    });

}

function createBasDriveFile(name, folder, key, callback) {
    var param = {
        "userKey": $("#common_aKey").val(),
        "deviceInfo": device,
        "parentKey": key,
        "parentType": "folder",
        "fileName": name
    }
    getCommonData("bascrmbasdrive/createBasDriveDocument", param, "new", function (result) {
        if (result.status) {
            if (callback != null) {
                callback(result);
            }
        }
    });
}

function getSharedLinkDetails(e, status) {
    if (status == null || status == undefined || status == "") {
        status = "active";
    }
    _getSharedBasDriveUniqueURLList(status, function (data) {
        $("#drive-items-listing").addClass("d-none");
        $("#drive-items-links").removeClass("d-none");
        //console.log(data);
        var _linkList = "";
        $.each(data.uniqueLinkList, function (i, k) {
            _linkList += "<tr data-key='" + k.uniqueLinkKey + "'><td><a href='" + k.uniqueLink
                + "' target='_blank'>" + k.uniqueLink
                + "</a></td><td>" + moment(k.dt).format(CONFIG.HHMMSS24) + "</td><td class='text-end'><a href='javascript:void(0)' class='btn btn-primary btn-sm me-2 _btnUniqueLinkFiles'><i class='fas fa-chevron-down'></i></a><a href='javascript:void(0)' class='btn btn-primary btn-sm me-2 _btnUniqueURLLogs'>Logs</a><a href='javascript:void(0)' class='btn btn-danger btn-sm me-2 _btnUpdateUniqueLogStatus' data-status='deactive'>Deactive</a></td></tr>";
        })
        $("#drive-items-links tbody").html(_linkList);

        $("._btnUniqueURLLogs").unbind("click");
        $("._btnUniqueURLLogs").each(function () {
            $(this).click(function () {
                $("#_offcanvasUniqueURLLogs").offcanvas("show");
                _getSharedBasDriveUniqueURLLogs($(this), function (data) {
                    _createUniqueUrlLogs(data.uniqueLinkLogsData);
                });
            })
        })

        $("._btnUpdateUniqueLogStatus").unbind("click");
        $("._btnUpdateUniqueLogStatus").each(function () {
            $(this).click(function () {
                var _logKey = $(this).closest("tr").attr("data-key");
                var _status = $(this).attr("data-status")
                _updateSharedBasDriveUniqueURLStatus(_logKey, _status, function (data) {
                    console.log(data);
                    if (data.status) {
                        bascrmShowErrorMessage("success", "fa-check-circle", "2500", "Successfuly deactivated", "");
                        getSharedLinkDetails();
                    } else {
                        bascrmShowErrorMessage("danger", "fa-times", "2500", "Some error, Please try again!", "");
                        getSharedLinkDetails();
                    }

                });
            })
        })

        $("#_basDriveUniqueUrlStatus").unbind("change");
        $("#_basDriveUniqueUrlStatus").change(function () {
            var ddlstatus = $(this).val();
            getSharedLinkDetails("", ddlstatus);
        });

        $("._btnUniqueLinkFiles").unbind("click");
        $("._btnUniqueLinkFiles").each(function () {
            $(this).click(function () {
                var key = $(this).closest("tr").attr("data-key");
                _getBasDriveDocumentShareItemsData(key, function (res) {
                    console.log(res);
                });
            })
        })
    })
}

function _createUniqueUrlLogs(data) {
    var _logs = "";
    $.each(data, function (i, k) {
        var iPdata = JSON.parse(k.ipdetail);
        _logs += "<div class='row g-3 timeline timeline-primary timeline-past pb-card' data-key='" + k.logKey + "'>\
                    <div class='col-auto ps-4 ms-2'>\
                      <div class='ps-2'>\
                        <div class='icon-item icon-item-sm rounded-circle bg-200 shadow-none'><span class='text-primary fas fa-envelope'></span></div>\
                      </div>\
                    </div>\
                    <div class='col'>\
                      <div class='row gx-0 border-bottom pb-card'>\
                        <div class='col'>\
                          <h6 class='text-800 mb-1'>"+ k.action_name + " from " + iPdata.ip + " (" + iPdata.city + "," + iPdata.country_name + ")</h6>\
                          <p class='fs--1 text-600 mb-0'>Date: "+ moment(k.dt).format(CONFIG.HHMMSS24) + "</p>\
                        </div>\
                      </div>\
                    </div>\
                  </div>";
    })
    $("#_offcanvasUniqueURLLogs .offcanvas-body .card-body").html(_logs);
}

function getSelectedDocumentsList(data) {
    var arrayListOfObj = [];
    if (data == null || data == undefined) {
        $("#_selectedFolderFoldersList ul li.dropdown-item").each(function (i, li) {
            arrayListOfObj.push({ "documentKey": $(li).attr("data-key"), "documentType": $(li).attr("data-type"), "flagType": ($(li).attr("data-parent-type") == "recent" ? "file" : $(li).attr("data-parent-type")) });
        });
    }
    else {
        arrayListOfObj.push({ "documentKey": data.docKey, "documentType": data.docType, "flagType": data.flagType });
    }

    return arrayListOfObj;
}

function bindFileVersionListActions() {
    var ele = $(".drive-item-version .drive-item-version-action");
    ele.off("click");
    ele.on("click", function () {
        //var versionKey = $(this).closest(".drive-item-version").attr("data-versionkey");
        var docType = $(this).closest(".drive-item-version").attr("data-type");
        var docKey = $(this).closest(".drive-item-version").attr("data-key");
        var parentType = $(this).closest(".drive-item-version").attr("data-parent-type");
        var action = $(this).attr("data-action");

        if (action == "view") {

        }
        else if (action == "file-share") {
            resetDocumentSelection();
            isCheckedItemDrive.push({
                "documentKey": docKey,
                "documentType": docType,
                "flagType": parentType,
                "e": $(this),
                "name": $(this).closest(".drive-item-version").find("._file_name_main").text()
            });

            goToActionDocumentShare();
        }
        else if (action == "file-email") {
            goToActionSendDocumentAsEmail($(this).closest(".drive-item-version"));
        }
        else if (action == "file-download") {
            if (docType.toLowerCase() == "fileversion") {
                goToActionDocumentDownload($(this).attr("data-downloadpath"));
            }
            else {

            }
        }
        else if (action == "file-delete") {
            goToActionDocumentRemove($(this).closest(".drive-item-version"), function (d) {
                if (d == "ok") {
                    $("._checked_actions_").hide();
                    $(".drive-item-version[data-key='" + docKey + "'][data-type='" + docType + "']").remove();
                    $.each(isCheckedItemDrive, function (i, val) {
                        $(".drive-item-version[data-key='" + val.documentKey + "'][data-type='" + val.documentType + "']").remove();
                    });
                    isCheckedItemDrive = [];
                }
            });
        }
        else if (action == "file-info") {
            goToActionDocumentInfo($(this).closest(".drive-item-version"));
        }
    });

    ele = $("#btn_fileversion_copylink");
    ele.off("click");
    ele.on("click", function () {
        getUniqueURL($(this));
    });
}

function bindSuggestedItemActions() {
    var ele = $("#_basDriveSuggestedItems .suggested-item-action");
    ele.off("click");
    ele.on("click", function () {
        var docType = $(this).closest(".suggested-item").attr("data-type");
        var docKey = $(this).closest(".suggested-item").attr("data-key");
        var parentType = $(this).closest(".suggested-item").attr("data-parent-type");
        var action = $(this).attr("data-action");

        if (action == "addVersion") {
            versionDocKey = docKey;
            $("#_basDriveInputFileVersion").trigger("click");
        }
        else if (action == "view") {
            //var path = encodeURIComponent($(this).closest(".suggested-item").attr("data-filefullpath"));
            //var name = encodeURIComponent($(this).closest(".suggested-item").attr("data-athname"));
            //var hasnewserver = $(this).closest(".suggested-item").attr("data-hasnewserver");
            //var key = encodeURIComponent(moment().format("HH:mm:ss.SSS").replace(/:/g, "").replace(".", "") + "aqkpm" + new Date().valueOf() + "j");
            //var hrefPath = "/modules/basdrive/editor?p=" + path + "&n=" + name + "&k=" + key + "&m=view&s=" + encodeURIComponent(hasnewserver) + "";
        }
        else if (action == "share") {
            resetDocumentSelection();
            isCheckedItemDrive.push({
                "documentKey": docKey,
                "documentType": docType,
                "flagType": parentType,
                "e": $(this),
                "name": $(this).closest(".suggested-item").find("._file_name_main").text()
            });

            goToActionDocumentShare();
        }
        else if (action == "sendViaEmail") {
            goToActionSendDocumentAsEmail($(this).closest(".suggested-item"));
        }
        else if (action == "download") {
            if (docType.toLowerCase() == "file") {
                goToActionDocumentDownload($(this).attr("data-downloadpath"));
            }
            else {

            }
        }
        else if (action == "delete") {
            goToActionDocumentRemove($(this).closest(".suggested-item"), function (d) {
                if (d == "ok") {
                    $("._checked_actions_").hide();
                    $("#_basDriveSuggestedItems").find(".suggested-item[data-key='" + docKey + "'][data-type='" + docType + "']").remove();
                    $.each(isCheckedItemDrive, function (i, val) {
                        $("#_basDriveSuggestedItems div.suggested-item[data-key='" + val.documentKey + "'][data-type='" + val.documentType + "']").remove();
                    })
                    isCheckedItemDrive = [];
                }
            });
        }
        else if (action == "markAsFavorite") {
            setBasDriveDocumentAsFavorite($(this).closest(".suggested-item"), function (d) {

            });
        }
    });
}

function createDocumentViewPath(name, path, hasnewserver, mode) {
    //var path = encodeURIComponent($(this).closest(".suggested-item").attr("data-filefullpath"));
    //var name = encodeURIComponent($(this).closest(".suggested-item").attr("data-athname"));
    //var hasnewserver = $(this).closest(".suggested-item").attr("data-hasnewserver");
    var key = encodeURIComponent(moment().format("HH:mm:ss.SSS").replace(/:/g, "").replace(".", "") + "aqkpm" + new Date().valueOf() + "j");
    var hrefPath = "/modules/basdrive/editor?p=" + path + "&n=" + name + "&k=" + key + "&m=" + mode + "&s=" + encodeURIComponent(hasnewserver) + "";

    return hrefPath;
}

function bindFileUploadButton() {
    // file input for version
    var ele = $("#_basDriveInputFileVersion");
    ele.off("change");
    ele.on("change", function (ev) {
        if (ev.target.files.length > 0) {
            var file = [];
            $.each(ev.target.files, function (k, f) {
                file.push({
                    "fileObj": f,
                    "fid": "fid_" + k + moment().format("x")
                });
            });

            //console.log(file);
            _uploadBasdriveFiles(file, _driveCurrentFolder, currentViewType, function (res) {
                // console.log(res);
                loadDriveData();
                versionDocKey = "0";
            });
        }
    });

    // file input for file
    var ele = $("#_basDriveInputFile");
    ele.off("change");
    ele.on("change", function (ev) {
        versionDocKey = "0";
        if (ev.target.files.length > 0) {
            var file = [];
            $.each(ev.target.files, function (k, f) {
                file.push({
                    "fileObj": f,
                    "fid": "fid_" + k + moment().format("x")
                });
            });
            //console.log(file);
            _uploadBasdriveFiles(file, _driveCurrentFolder, currentViewType, function (res) {
                // console.log(res);
                loadDriveData();
            });
        }
    });

    // file input for folder
    //document.getElementById("_tigFolder").addEventListener("change", function (event) {
    ele = $("#_tigFolder");
    ele.off("change");
    ele.on("change", function (ev) {
        resetFolderUploadFeature();
        $.each(ev.target.files, function (k, f) {
            fileObjList.push({
                "fileObj": f,
                "fid": "fid_" + k + moment().format("x"),
                "path": f.webkitRelativePath
            });
            var item = document.createElement("li");
            item.innerHTML = f.webkitRelativePath;
            $("._listUploadMultipleFilesFolders ul").append(item);
        });

        $("#fileListModal").modal("show");
        bindUploadFolderBtn();
    });

}

function bindUploadFolderBtn() {
    var ele = $("#btn_upload_folder");
    ele.off("click");
    ele.on("click", function () {
        $("#fileListModal").modal("hide");
        checkIfBasDriveFileExist(fileObjList[0].path.split("/")[0], currentViewType, _driveCurrentFolder, "folder", function (data) {
            if (data != null) {
                if (!data.isExist) {
                    _uploadBasdriveFiles(fileObjList, _driveCurrentFolder, currentViewType, function (res) {
                        // console.log(res);
                        loadDriveData();
                        resetFolderUploadFeature();
                    });
                }
                else {
                    bascrmShowErrorMessage("danger", "fa-times", "2500", "Folder name already exist", "");
                    resetFolderUploadFeature();
                }
            }
            else {
                resetFolderUploadFeature();
            }
        });
    });
}

function resetFolderUploadFeature() {
    fileObjList = [];
    $("._listUploadMultipleFilesFolders ul").html("");
}

function uploadTigFolder(e) {
    $("#_tigFolder").trigger("click");
}

function uploadDocumentFile(e) {
    $("#_basDriveInputFile").trigger("click");
}

function goToActionSendDocumentAsEmail(ele) {
    getEmailDataForFileEmail(ele, function (data) {
        console.log(data);
        _activeEmailSubject = encodeURIComponent(data.emailSubject);
        _activeEmailBody = encodeURIComponent(data.emailBody);
        $("._bascrm_openComposeEmail").trigger("click");
    })
}

function goToActionDocumentDownload(url) {
    //if (isCheckedItemDrive.length > 1) {
    //    bascrmShowErrorMessage("success", "fa-spinner fa-spin", "1500", "Compressing file(s)....", "");        
    //    compressDownload(function (result) {
    //        var url = result.zipFilePath.replaceAll("\\", "/").replace("C:/inetpub/wwwroot/BascrmDocuments/", "https://docs.bascrm.se/");
    //        createDocumnetDownloadFrame(url);
    //    });
    //}
    //else {
    bascrmShowErrorMessage("success", "fa-spinner fa-spin", "1500", "Downloading....", "");
    createDocumnetDownloadFrame(url);
    //}
}

function goToActionDocumentCompress(ele) {
    bascrmShowErrorMessage("success", "fa-spinner fa-spin", "1500", "Compressing file(s)....", "");
    compressDownload(ele, function (result) {
        var url = result.zipFilePath.replaceAll("\\", "/").replace("C:/inetpub/wwwroot/BascrmDocuments/", "https://docs.bascrm.se/");
        goToActionDocumentDownload(url);
        resetDocumentSelection();
    });
}

function createDocumnetDownloadFrame(url) {
    const a = document.createElement('iframe');
    a.style.display = 'none';
    a.src = url;
    a.className = "_downloadIframe_BC"
    document.body.appendChild(a);
    setTimeout(function () {
        $("._downloadIframe_BC").remove();
        isCheckedItemDrive = [];
    }, 50000);
}

function goToActionDocumentRemove(ele, callback) {
    var message = deletedrivefilefolder;
    if (currentView == "trash") {
        message = deletedrivefilefolderFromTrash;
    }
    swal({
        title: "",
        text: message,
        icon: "warning",
        buttons: true,
        dangerMode: true,
    })
        .then((willDelete) => {
            if (willDelete) {

                if (isCheckedItemDrive.length > 0) {
                    type = "Files/Folders"
                }
                removeFileFolder(ele, function (result) {
                    if (result.status) {
                        bascrmShowErrorMessage("success", "fa-check-circle", "3000", "Successfully deleted!", "");
                        callback("ok")
                    } else {
                        bascrmShowErrorMessage("danger", "fa-check-circle", "2000", "Some error occurred, please try again!", "");
                        callback(null);
                    }


                });
            }
        });
}

function goToActionDocumentShare() {
    $("._listFilesFoldersToShare").html("");
    if (isCheckedItemDrive.length > 0) {
        var ul = "<ul class='list-group'>";
        $.each(isCheckedItemDrive, function (i, k) {
            ul += "<li class='list-group-item' data-key='" + k.documentKey + "' data-type='" + k.documentType + "' data-parent-type='" + k.flagType + "'>" + k.name + " <span class='float-end'><a href='javascript:void(0)' class='btn btn-danger btn-sm _removeItem'><i class='fas fa-times'></i></a></span></li>";
        });
        ul += "<ul>";

        $("._listFilesFoldersToShare").html(ul);
    }

    setUserListForSelectize(userList);


    //Remove from share list
    $("._listFilesFoldersToShare ._removeItem").unbind("click");
    $("._listFilesFoldersToShare ._removeItem").each(function () {
        $(this).click(function () {
            // updated by VIJAY
            deSelectDocument($(this).closest("li").attr("data-key"), $(this).closest("li").attr("data-type"));
            //isCheckedItemDrive = removeByAttr(isCheckedItemDrive, 'documentKey', $(this).closest("li").attr("data-key"));                    
            //$(this).closest("li").remove();
        });
    });

    // Bind share type
    $("._shareTypeBasDrive a").unbind("click");
    $("._shareTypeBasDrive a").each(function () {
        $(this).click(function () {
            $("._shareTypeBasDrive a").removeClass("active");
            $(this).addClass("active");

            var type = $(this).attr("data-type");
            if (type == "user") {
                $("._selectUserShare").removeClass("d-none");
                $("._selectGroupShare").addClass("d-none");
            } else if (type == "group") {
                $("._selectUserShare").addClass("d-none");
                $("._selectGroupShare").removeClass("d-none");
            }
        });
    })

    $("#_shareMyFileFolders").offcanvas("show");
    bindTextareaAutoGrow();
}

function goToActionDocumentInfo(ele) {
    getfileFolderInfo(ele, function (e) {
        if (e.documentInfo[0].icon == "") {
            var icon = "<i class='fas fa-folder me-2'></i>";
            var type = "Folder";
        } else {
            var icon = "<div class='avatar avatar-xl me-2'><img class='rounded-soft' src='" + e.documentInfo[0].icon.replaceAll("/images/", "/assets/img/") + "' alt='' /></div>";
            var type = "File";
        }
        $("#_offDocumentFolderInformation #_offTitleDocumetnFolder").html(icon + e.documentInfo[0].athname);
        $("#_item_icon").html(icon);
        $("._details_item_type").html(e.documentInfo[0].typeofobject + " " + e.documentInfo[0].ext);
        $("._details_item_created").html(moment(e.documentInfo[0].dt).format(CONFIG.dateformat));
        $("._details_item_modified").html(moment(e.documentInfo[0].updated).format(CONFIG.dateformat) + " [" + e.documentInfo[0].uploaded_byname + "]");
        $("._details_item_size").html(e.documentInfo[0].size);
        $("._details_item_parent").html(e.documentInfo[0].parent_name);
        $("._details_item_owner").html(e.documentInfo[0].createdby)
        $("#_offDocumentFolderInformation").offcanvas("show");

        var activities = "";
        $.each(e.documentActivityList, function (i, t) {
            if (type == "folder") {

            }
            activities += "<div class='row g-3 timeline timeline-primary timeline-past pb-card'>\
                            <div class='col-auto ps-4 ms-2'>\
                                <div class='ps-2'>\
                                <div class='icon-item icon-item-sm rounded-circle bg-200 shadow-none'><span class='avatar avatarxl'><img class='rounded-circle' onerror=checkIfImageExists(this) src='https://crm.bascrm.com/uploadcontracts/employee"+ t.loginid + ".png' alt='' /></span> </div>\
                                </div>\
                            </div>\
                            <div class='col'>\
                                <div class='row gx-0 border-bottom pb-card'>\
                                <div class='col'>\
                                    <h6 class='text-800 mb-1'>"+ t.name + " " + t.type + " " + type + "</h6>\
                                    <p class='fs--1 text-600 mb-0'>"+ moment(t.dt).format(CONFIG.dateFormatWithFulDay) + "</p>\
                                </div>\
                                </div>\
                            </div>\
                            </div>";
        })
        $("._file_timeline_details").html(activities);
    });
}

function setBasDriveDocumentAsFavorite(ele, callback) {
    var key = ele.attr("data-key");
    var type = ele.attr("data-type");
    var flagType = ele.attr("data-parent-type");


    var param = {
        "userKey": $("#common_aKey").val(),
        "deviceInfo": device,
        "docKey": key,
        "parentType": flagType
    }
    getCommonData("bascrmbasdrive/SetBasDriveDocumentAsFavorite", param, "new", function (result) {
        if (result.status) {
            bascrmShowErrorMessage("success", "fa-check-circle", "3000", "successfully done!", "");
            callback("ok");
        }
        else {
            bascrmShowErrorMessage("success", "fa-check-circle", "2000", result.errormessage, "");
            callback(null);
        }
    });
}

function createSelectedGroupMemberDiv(userData, ele) {
    if ($(ele).find("li[data-key='" + userData.UserKey + "']").length == 0) {
        $(ele).append("<li class='list-group-item d-flex align-items-center justify-content-between' data-key='" + userData.UserKey + "' data-email='" + userData.Email + "' data-username='" + userData.Name + "'><div>" + userData.Name + " <span class='_axpRights badge badge-soft-secondary' data-right='read'>View only</span> <br>" + userData.Email + "</div><div><button class='btn btn-falcon-default dropdown-toggle btn-sm' type='button' data-bs-toggle='dropdown' aria-haspopup='true' aria-expanded='false'><i class='fas fa-cog'></i></button><div class='dropdown-menu dropdown-menu-end py-0' aria-labelledby='dropdownMenuButton'><a class='dropdown-item' href='javascript:void(0)' onclick=setAccessRightsForFileFolder(this) data-value='View only'>View only</a><a class='dropdown-item' href='javascript:void(0)' data-value='Editor' onclick=setAccessRightsForFileFolder(this)>Editor</a><a class='dropdown-item' href='javascript:void(0)'  onclick=setAccessRightsForFileFolder(this) data-value='Owner' >Owner</a><div class='dropdown-divider'></div><a class='dropdown-item text-danger' href='javascript:void(0)' onclick=_removeUserGroupFromSharing(this)>Remove</a></div></div></li>");
    }
}

var groupMemberSelectizeControl = null;
function openAddGroupMemberPanel(ele) {

    $("#lbl_group_name_add_member").find("span.groupName").html($(ele).parent().attr("data-group-name"));
    $("#lbl_group_name_add_member").attr("data-group-key", $(ele).parent().attr("data-group-key"));
    $("#lbl_group_name_add_member").attr("data-group-type", $(ele).parent().attr("data-group-type"));
    $("#ul_selected_group_members_add_group_member li").remove();

    getUserList(function (result) {
        groupMemberSelectizeControl = $("#ddl_users_add_group_member").selectize({
            persist: false,
            valueField: "UserKey",
            labelField: "Name",
            searchField: ["Name"],
            sortField: "Name",
            closeAfterSelect: true,
            maxItems: 1,
            create: false,
            options: result,
            render: {
                item: function (item, escape) {
                    return (
                        "<div data-value='" + item.userKey + "' class='p-1'>" + item.Name + " [" + item.Email + "]</div>"
                    );

                },
                option: function (item, escape) {
                    return (
                        "<div data-value='" + item.userKey + "' class='p-1'>" + item.Name + " [" + item.Email + "]</div>"
                    );
                },
            },
            onChange: function (value) {
                var d = groupMemberSelectizeControl[0].selectize.options[value];
                if (value.length > 0) {
                    createSelectedGroupMemberDiv(d, $("#ul_selected_group_members_add_group_member"));
                }
                resetGroupMemberSelectizeControl();
            }
        });

        $("#panel_add_group_member").offcanvas("show");
    })
}

function resetGroupMemberSelectizeControl() {
    try {
        var control = groupMemberSelectizeControl[0].selectize;
        control.clear();
    } catch (e) { }
}

function addGroupMember(e) {
    var groupMemberList = [];
    $.each($("#ul_selected_group_members_add_group_member li"), function (i, li) {
        groupMemberList.push({ "memberKey": $(li).attr("data-key"), "rights": $(li).find("._axpRights").attr("data-right") });
    });

    if (groupMemberList.length > 0) {
        $(e).html("Saving...");

        var param = {
            "userKey": $("#common_aKey").val(),
            "deviceInfo": device,
            "groupKey": $("#lbl_group_name_add_member").attr("data-group-key"),
            "groupMemberList": groupMemberList
            //"parentKey": parentKey
        }
        getCommonData("bascrmbasdrive/AddBasDriveGroupMember", param, "new", function (result) {
            if (result.status) {
                $("#panel_add_group_member").offcanvas("hide");
                bascrmShowErrorMessage("success", "fa-check-circle", "2000", "Member added successfully!", "");
                $(e).html("Add");
                resetGroupMemberSelectizeControl();
                $("#ul_selected_group_members_add_group_member li").remove();

                var res = [];
                res.push({
                    "name": $("#lbl_group_name_add_member").find("span.groupName").html(),
                    "key": $("#lbl_group_name_add_member").attr("data-group-key"),
                    "type": $("#lbl_group_name_add_member").attr("data-group-type"),
                    "guid": $("#lbl_group_name_add_member").find("span.groupName").html()
                })
                accessItem("", res);
                //getPersonalFolders("0", "");
            } else {
                bascrmShowErrorMessage("danger", "fa-check-circle", "2000", "Some error occurred, please try again!", "");
                $(e).html("Create");
            }
        });
    }
    else {
        bascrmShowErrorMessage("danger", "fa-check-circle", "2000", "No user selected to add!", "");
    }
}

var systemFolderMemberSelectizeControl = null;
function openSystemFolderCreatePanel(e) {
    getUserList(function (result) {
        systemFolderMemberSelectizeControl = $("#ddl_system_folder_member").selectize({
            persist: false,
            valueField: "UserKey",
            labelField: "Name",
            searchField: ["Name"],
            sortField: "Name",
            closeAfterSelect: true,
            maxItems: 1,
            create: false,
            options: result,
            render: {
                item: function (item, escape) {
                    return (
                        "<div data-value='" + item.userKey + "' class='p-1'>" + item.Name + " [" + item.Email + "]</div>"
                    );

                },
                option: function (item, escape) {
                    return (
                        "<div data-value='" + item.userKey + "' class='p-1'>" + item.Name + " [" + item.Email + "]</div>"
                    );
                },
            },
            onChange: function (value) {
                var d = systemFolderMemberSelectizeControl[0].selectize.options[value];
                if (value.length > 0) {
                    createSelectedGroupMemberDiv(d, $("#ul_selected_system_folder_members"));
                }
                resetSystemFolderMemberSelectizeControl();
            }
        });

        $("#panel_add_system_folder").offcanvas("show");

        $("#txt_system_folder_name").on('keyup', function (e) {
            if ($(this).val() != "") {
                $("#btn_create_system_folder").removeClass("btn-secondary").addClass("btn-success").removeClass("disabled");
            }
            if (e.keyCode == 8) {
                if ($(this).val() == "") {
                    $("#btn_create_system_folder").addClass("btn-secondary").removeClass("btn-success").addClass("disabled");
                }
            }
        });
    })
}

function resetSystemFolderMemberSelectizeControl() {
    try {
        var control = systemFolderMemberSelectizeControl[0].selectize;
        control.clear();
    } catch (e) { }
}

function createSystemFolder(e) {
    if ($.trim($("#txt_system_folder_name").val()).length > 0) {
        $(e).html("Creating...");

        var groupMemberList = [];
        $.each($("#ul_selected_system_folder_members li"), function (i, li) {
            groupMemberList.push({ "memberKey": $(li).attr("data-key"), "rights": $(li).find("._axpRights").attr("data-right") });
        });

        var param = {
            "userKey": $("#common_aKey").val(),
            "deviceInfo": device,
            "folderName": $.trim($("#txt_system_folder_name").val()),
            "groupMemberList": groupMemberList
            //"parentKey": parentKey
        }
        getCommonData("bascrmbasdrive/CreateBasDriveSystemFolder", param, "new", function (result) {
            if (result.status) {
                $("#panel_add_system_folder").offcanvas("hide");
                $("#txt_system_folder_name").val("");
                bascrmShowErrorMessage("success", "fa-check-circle", "2000", "Folder created successfully!", "");
                $(e).html("Create");
                resetSystemFolderMemberSelectizeControl();
                $("#ul_selected_system_folder_members li").remove();
                GetBasDriveSystemFolderList();

                var res = [];
                res.push({
                    "name": param.folderName,
                    "key": result.groupKey,
                    "type": "group",
                    "guid": param.folderName
                })
                accessItem("", res);

            } else {
                bascrmShowErrorMessage("danger", "fa-check-circle", "2000", "Some error occurred, please try again!", result.errormessage);
                $(e).html("Create");
            }
        });
    }
    else {
        bascrmShowErrorMessage("danger", "fa-check-circle", "2000", "Folder name can not be empty!", "");
    }
}
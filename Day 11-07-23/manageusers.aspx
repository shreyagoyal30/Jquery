<%@ Page Language="C#" AutoEventWireup="true" CodeFile="manageusers.aspx.cs" Inherits="settings_BASDrive_external_manage" %>

<%@ Register Src="~/assets/controls/common.ascx" TagPrefix="uc1" TagName="common" %>
<%@ Register Src="~/assets/controls/front/menu.ascx" TagPrefix="uc1" TagName="menu" %>
<%@ Register Src="~/assets/controls/front/header.ascx" TagPrefix="uc1" TagName="header" %>

<%@ Register Src="~/assets/controls/front/footer.ascx" TagPrefix="uc1" TagName="footer" %>
<%@ Register Src="~/assets/controls/settings/theme.ascx" TagPrefix="uc1" TagName="theme" %>
<%@ Register Src="~/assets/controls/settings/helpdesk/head.ascx" TagPrefix="uc1" TagName="head" %>
<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">


    <!-- ===============================================-->
    <!--    Document Title-->
    <!-- ===============================================-->
    <title>BASCRM | Helpdesk groups </title>

    <!-- ===============================================-->
    <!--    Favicons-->
    <!-- ===============================================-->
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/img/favicons/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/img/favicons/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/assets/img/favicons/favicon-16x16.png">
    <link rel="shortcut icon" type="image/x-icon" href="/assets/img/favicons/favicon.ico">

    <meta name="msapplication-TileImage" content="/assets/img/favicons/mstile-150x150.png">
    <meta name="theme-color" content="#ffffff">
    <script src="/assets/js/config.js"></script>
    <script src="/vendors/overlayscrollbars/OverlayScrollbars.min.js"></script>

    <!-- ===============================================-->
    <!--    Stylesheets-->
    <!-- ===============================================-->
    <link rel="preconnect" href="https://fonts.gstatic.com/">
    <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,500,600,700%7cPoppins:300,400,500,600,700,800,900&amp;display=swap" rel="stylesheet">
    <link href="/vendors/overlayscrollbars/OverlayScrollbars.min.css" rel="stylesheet">
    <link href="/assets/css/theme-rtl.min.css" rel="stylesheet" id="stylertl">
    <link href="/assets/css/theme.min.css" rel="stylesheet" id="styledefault">
    <link href="/assets/css/user-rtl.min.css" rel="stylesheet" id="userstylertl">
    <link href="/assets/css/user.min.css" rel="stylesheet" id="userstyledefault">
    <script>
        var isRTL = JSON.parse(localStorage.getItem('isRTL'));
        if (isRTL) {
            var linkDefault = document.getElementById('styledefault');
            var userLinkDefault = document.getElementById('userstyledefault');
            linkDefault.setAttribute('disabled', true);
            userLinkDefault.setAttribute('disabled', true);
            document.querySelector('html').setAttribute('dir', 'rtl');
        } else {
            var linkRTL = document.getElementById('stylertl');
            var userLinkRTL = document.getElementById('userstylertl');
            linkRTL.setAttribute('disabled', true);
            userLinkRTL.setAttribute('disabled', true);
        }
    </script>
</head>
<body>
    <form id="form1" runat="server">
        <!-- ===============================================-->
        <!--    Main Content-->
        <!-- ===============================================-->
        <main class="main" id="top">
             <input type="hidden" id="drivekey" name="data" value="" runat="server"/>
            <div class="container-fluid" data-layout="container">
                <uc1:menu runat="server" ID="menu" />
                <div class="content p-0">
                    <uc1:header runat="server" ID="header" />
                    <!-- Content area -->
                    <%--<uc1:head runat="server" id="head" />--%>
                    <div class="row g-3 mb-3">
                        <nav aria-label="breadcrumb">
                            <ol class="breadcrumb">
                                <li class="breadcrumb-item"><a href="/settings/dashboard">Settings</a></li>
                                <li class="breadcrumb-item"><a href="/settings/BASDrive/external/drive">Manage External Drive</a></li>
                                <li class="breadcrumb-item active" aria-current="page">150 GB (Manage users)</li>
                            </ol>
                        </nav>
                    </div>
                    <div class="row g-3"  id="manageusers">
                        </div>
                    </div>
                    <!-- Ends -->
                    <uc1:footer runat="server" ID="footer" />
                </div>

            </div>
        </main>
        <!-- ===============================================-->
        <!--    End of Main Content-->
        <!-- ===============================================-->

        <uc1:theme runat="server" ID="theme" />
    </form>

    <!-- ===============================================-->
    <!--    JavaScripts-->
    <!-- ===============================================-->
    <script src="/vendors/popper/popper.min.js"></script>
    <script src="/vendors/bootstrap/bootstrap.min.js"></script>
    <script src="/vendors/anchorjs/anchor.min.js"></script>
    <script src="/vendors/is/is.min.js"></script>

    <script src="/vendors/chart/chart.min.js"></script>
    <script src="/vendors/countup/countUp.umd.js"></script>
    <script src="/vendors/lodash/lodash.min.js"></script>
    <script src="/vendors/echarts/echarts.min.js"></script>
    <script src="/vendors/dayjs/dayjs.min.js"></script>
    <script src="/vendors/fontawesome/all.min.js"></script>
    <script src="/vendors/lodash/lodash.min.js"></script>
    <script src="/polyfill.io/v3/polyfill.min58be.js?features=window.scroll"></script>
    <script src="/vendors/list.js/list.min.js"></script>
    <script src="/assets/js/theme.js"></script>

    <!-- ===============================================-->
    <!--    Contain jQuery and other common js-->
    <!-- ===============================================-->
    <uc1:common runat="server" ID="common" />

    <!-- ===============================================-->
    <!--    Page wise js will come below-->
    <!-- ===============================================-->
     <script src="/assets/js/pageJS/settings/BASDrive/drive.js"></script>
</body>
</html>
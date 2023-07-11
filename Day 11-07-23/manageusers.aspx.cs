using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

public partial class settings_BASDrive_external_manage : System.Web.UI.Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
        if (Request.QueryString["drive"] != null)
        {
            drivekey.Value = Request.QueryString["drive"];
        }
    }
}
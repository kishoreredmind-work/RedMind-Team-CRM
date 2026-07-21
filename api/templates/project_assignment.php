<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Project Assignment</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 20px;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); border: 1px solid #E2E8F0;">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #000000; padding: 32px 40px; text-align: left;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td>
                                        <div style="display: inline-block; width: 36px; height: 36px; background-color: #FFFFFF; border-radius: 10px; text-align: center; line-height: 36px; color: #000000; font-weight: 900; font-size: 20px; font-family: Arial, sans-serif; float: left; margin-right: 12px;">R</div>
                                        <span style="color: #FFFFFF; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; line-height: 36px; font-family: inherit;">RedMind Team</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 40px 40px 30px 40px;">
                            <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 900; color: #0F172A; tracking: -0.5px;">New Project Assignment</h1>
                            <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 24px; color: #475569; font-weight: 500;">Hi <?php echo htmlspecialchars($name); ?>,</p>
                            <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 24px; color: #475569; font-weight: 500;">You have been assigned to a new corporate project stream inside the CRM. Please review the parameters of the project below:</p>
                            
                            <!-- Project Info Box -->
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border-radius: 16px; padding: 24px; margin-bottom: 32px; border: 1px solid #F1F5F9;">
                                <tr>
                                    <td style="padding-bottom: 12px;">
                                        <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94A3B8; tracking: 1px; display: block; margin-bottom: 4px;">Project Name</span>
                                        <span style="font-size: 16px; font-weight: 900; color: #0F172A;"><?php echo htmlspecialchars($projectName); ?></span>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Action Button -->
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                                <tr>
                                    <td align="left">
                                        <a href="<?php echo htmlspecialchars($loginUrl); ?>" style="display: inline-block; background-color: #000000; color: #FFFFFF; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; padding: 16px 36px; border-radius: 50px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">Review Project Details</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F8FAFC; padding: 24px 40px; border-top: 1px solid #F1F5F9; text-align: left;">
                            <span style="font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; tracking: 0.5px;">RedMind Team CRM &bull; Project Assignment Alert</span>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

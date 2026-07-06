function doGet(e) {
  var fileId = e.parameter.fileId;
  if (fileId) {
    try {
      var file = DriveApp.getFileById(fileId);
      var blob = (e.parameter.size === 'full') ? file.getBlob() : (file.getThumbnail() || file.getBlob());
      return ContentService.createTextOutput(Utilities.base64Encode(blob.getBytes()))
        .setMimeType(ContentService.MimeType.TEXT);
    } catch (error) {
      return ContentService.createTextOutput("Error: " + error.message)
        .setMimeType(ContentService.MimeType.TEXT);
    }
  }

  var folderId = e.parameter.id;
  if (!folderId) {
    return ContentService.createTextOutput(JSON.stringify({error: "Missing folder ID"})).setMimeType(ContentService.MimeType.JSON);
  }
  
  try {
    var result = [];
    var query = "'" + folderId + "' in parents and trashed = false and (mimeType contains 'image/' or mimeType contains 'video/')";
    var url = "https://www.googleapis.com/drive/v3/files?q=" + encodeURIComponent(query) + "&fields=files(id,name,mimeType,thumbnailLink)&pageSize=1000";
    
    var response = UrlFetchApp.fetch(url, {
      headers: {
        "Authorization": "Bearer " + ScriptApp.getOAuthToken()
      },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      var data = JSON.parse(response.getContentText());
      if (data.files) {
        result = data.files.map(function(file) {
          return {
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            thumbnailLink: file.thumbnailLink
          };
        });
      }
    } else {
      // Fallback to DriveApp if UrlFetchApp fails or has permission/scope issues
      return getFilesWithDriveApp(folderId);
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Fallback to DriveApp
    return getFilesWithDriveApp(folderId);
  }
}

function getFilesWithDriveApp(folderId) {
  try {
    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFiles();
    var result = [];
    while (files.hasNext()) {
      var file = files.next();
      var mimeType = file.getMimeType();
      if (mimeType.indexOf('image/') !== -1 || mimeType.indexOf('video/') !== -1) {
        result.push({
          id: file.getId(),
          name: file.getName(),
          mimeType: mimeType,
          thumbnailLink: "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w500" // Fallback thumbnail link using cookie-authenticated Drive endpoint
        });
      }
    }
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({error: e.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

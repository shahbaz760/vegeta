import randomstring from "randomstring";
import fs from "fs";
import fetch from "node-fetch";
import { ROLES } from "../../../config/constants";

import { S3Client, DeleteObjectCommand, DeleteObjectsCommand, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3 = new S3Client({ region: process.env.AWS_REGION });
import sequelize from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import axios from "axios";
const Op = sequelize.Op;
const { Upload } = require('@aws-sdk/lib-storage');





const { google } = require('googleapis');
const { oauth2 } = require('googleapis/build/src/apis/oauth2');
const calenderFile = require('../c4ng-374906-0f133d94d1cd.json');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const CALENDAR_ID = process.env.CALENDAR_ID;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const { OAuth2Client } = require('google-auth-library');
const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
const moment = require("moment")

const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

/****  get user roles  ****/
export const getAccessRoles = async (db) => {
  const userAccess = {};
  const userRoles = await db.models.Roles.findAll({
    where: {
      parent_role_id: null
    },
    raw: true
  });

  for (const ele of userRoles) {
    if (ele.name == "Admin") {
      userAccess.Admin = ele.id;
    }
    if (ele.name == "Client") {
      userAccess.Client = ele.id;
    }
    if (ele.name == "Agent") {
      userAccess.Agent = ele.id;
    }
    if (ele.name == "Account Manager") {
      userAccess.AccountManager = ele.id;
    }
    if (ele.name == "User") {
      userAccess.User = ele.id;
    }
  }

  return userAccess;
};

export const generateSalesCode = async (services) => {
  const randomstr = randomstring.generate(6);
  let sales_code = `${randomstr}`.toUpperCase();

  const store = await services.getStoreBySalesCode(sales_code);

  if (store) {
    await generateSalesCode(services);
  } else {
    return sales_code;
  }
};


/** **  Function for upload file to S3 Bucket (Updated Code in V3) *** */
export const uploadFileToAWS = async (params) => {
  try {
    const command = new PutObjectCommand(params);
    const response = await s3.send(command);
    return {
      Location: `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`,
      Key: params.Key,
      ...response,
    };
  } catch (err) {
    console.log(err);
    throw err;
  }
};

/* upload file common function*/
export const uploadFileForAll = async (detail) => {
  const { files, id, folder } = detail;
  try {
    const uploadedFiles = [];
    for (const ele of files) {
      const data = ele.buffer;
      const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: `${folder}/${id}/${Date.now()}-rcw.${ele.originalname
          .split(".")
          .pop()}`,
        Body: data,
        ACL: "public-read",
        ContentType: ele.mimetype,
        ContentEncoding: "base64",
        ContentDisposition: "inline",
      };
      const result = await uploadFileToAWS(params);
      ele.location = result.Location;
      ele.key = result.Key;
    }
    if (files) {
      if (files.length > 0) {
        files.forEach((file) => {
          const upload = {
            path: file.location,
            type: file.mimetype,
            name: file.originalname,
            file_key: file.key,
          };
          uploadedFiles.push(upload);
        });
      }
    }
    return uploadedFiles;
  } catch (error) {
    console.log(error, "======");
  }
};

/** Updated coded in AWS V3 */
export const s3RemoveSingleFile = async (key) => {
  const deleteParam = {
    Bucket: process.env.AWS_BUCKET,
    Key: key,
  };
  try {
    const command = new DeleteObjectCommand(deleteParam);
    const response = await s3.send(command);
    return response;
  } catch (error) {
    throw error;
  }
};

export const s3RemoveMultipleFiles = async (keys) => {
  const deleteParams = {
    Bucket: process.env.AWS_BUCKET,
    Delete: {
      Objects: keys.map((key) => ({ Key: key })),
    },
  };

  try {
    const command = new DeleteObjectsCommand(deleteParams);
    const response = await s3.send(command);
    return response;
  } catch (error) {
    throw error;
  }
};


export const checkOrCreateCometChatRoles = async () => {
  const url =
    process.env.CHAT_API_HOST.replace("APPID", process.env.CHAT_APP_ID).replace(
      "REGION",
      process.env.CHAT_REGION
    ) + "roles";
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      apikey: process.env.CHAT_API_KEY,
    },
  };

  fetch(url, options)
    .then((res) => res.json())
    .then((json) => {
      let roleData = [];
      if (json && json.data && json.data.length > 0) {
        roleData = json.data.map((d) => d.role);
      }

      options.method = "POST";
      Object.keys(ROLES).forEach((value) => {
        if (!roleData.includes(value.toLowerCase())) {
          options.body = JSON.stringify({
            role: value.toLowerCase(),
            name: value,
          });
          fetch(url, options)
            .then((res) => res.json())
            .then((json) => console.log("Role created...", json))
            .catch((err) => console.error("error in creating ROLES:" + err));
        }
      });
    })
    .catch((err) => console.error("error in getting ROLES:" + err));
};


/** Get comet chat user */
export const getCometChatUser = async (uid) => {
  const url = process.env.CHAT_API_HOST.replace("APPID", process.env.CHAT_APP_ID).replace("REGION", process.env.CHAT_REGION) + "users/" + uid;
  const options = {
    method: 'GET',
    url: url,
    headers: { accept: 'application/json', apikey: process.env.CHAT_API_KEY }
  };
  return await axios.request(options);
  // return await fetch(url, options);
};

export const createCometChatUser = async (
  name,
  uid,
  role,
  email,
  contactNumber
) => {
  const url =
    process.env.CHAT_API_HOST.replace("APPID", process.env.CHAT_APP_ID).replace(
      "REGION",
      process.env.CHAT_REGION
    ) + "users";
  const options = {
    method: "POST",
    body: JSON.stringify({
      name,
      uid,
      role,
      metadata: { "@private": { email, contactNumber } },
    }),
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      apikey: process.env.CHAT_API_KEY,
    },
  };

  return await fetch(url, options);
};

export const updateCometChatUser = async (uid, body) => {
  const url =
    process.env.CHAT_API_HOST.replace("APPID", process.env.CHAT_APP_ID).replace(
      "REGION",
      process.env.CHAT_REGION
    ) + `users/${uid}`;
  const options = {
    method: "PUT",
    body: JSON.stringify(body),
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      apikey: process.env.CHAT_API_KEY,
    },
  };

  return await fetch(url, options);
};


export const createCometChatGroup = async (
  guid,
  name,
  owner,
  type
) => {
  const url =
    process.env.CHAT_API_HOST.replace("APPID", process.env.CHAT_APP_ID).replace(
      "REGION",
      process.env.CHAT_REGION
    ) + "groups";

  const options = {
    method: "POST",
    body: JSON.stringify({
      guid,
      name,
      // owner,
      type
    }),
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      apikey: process.env.CHAT_API_KEY,
    },
  };
  return await fetch(url, options);
};


export const createCometChatGroupMembers = async (
  guid,
  memberIds,
) => {
  const url =
    process.env.CHAT_API_HOST.replace("APPID", process.env.CHAT_APP_ID).replace(
      "REGION",
      process.env.CHAT_REGION
    ) + `groups/${guid}/members`;
  const options = {
    method: "POST",
    body: JSON.stringify({
      participants: memberIds,
    }),
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      apikey: process.env.CHAT_API_KEY,
    },
  };

  return await fetch(url, options);
};


export const removeCometChatGroupMembers = async (
  guid,
  uid,
) => {
  const url =
    process.env.CHAT_API_HOST.replace("APPID", process.env.CHAT_APP_ID).replace(
      "REGION",
      process.env.CHAT_REGION
    ) + `groups/${guid}/members/${uid}`;
  const options = {
    method: "DELETE",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      apikey: process.env.CHAT_API_KEY,
    },
  };

  return await fetch(url, options);
};


export const updateCometChatGroup = async (
  guid,
  name,
) => {
  const url =
    process.env.CHAT_API_HOST.replace("APPID", process.env.CHAT_APP_ID).replace(
      "REGION",
      process.env.CHAT_REGION
    ) + `groups/${guid}`;
  const options = {
    method: "PUT",
    body: JSON.stringify({
      name,
    }),
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      apikey: process.env.CHAT_API_KEY,
    },
  };

  return await fetch(url, options);
};


export const getCometChatGroupMembers = async (
  guid,
) => {
  const url =
    process.env.CHAT_API_HOST.replace("APPID", process.env.CHAT_APP_ID).replace(
      "REGION",
      process.env.CHAT_REGION
    ) + `groups/${guid}/members`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      apikey: process.env.CHAT_API_KEY,
    },
  };

  return await fetch(url, options);
};


export const getCometChatGroupDetail = async (
  guid,
) => {
  const url =
    process.env.CHAT_API_HOST.replace("APPID", process.env.CHAT_APP_ID).replace(
      "REGION",
      process.env.CHAT_REGION
    ) + `groups/${guid}`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      apikey: process.env.CHAT_API_KEY,
    },
  };

  return await fetch(url, options);
};

export const deleteCometChatGroup = async (
  guid,
) => {
  const url =
    process.env.CHAT_API_HOST.replace("APPID", process.env.CHAT_APP_ID).replace(
      "REGION",
      process.env.CHAT_REGION
    ) + `groups/${guid}`;
  const options = {
    method: "DELETE",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      apikey: process.env.CHAT_API_KEY,
    },
  };

  return await fetch(url, options);
};


export const deleteCometChatUser = async (uid) => {
  const url =
    process.env.CHAT_API_HOST.replace("APPID", process.env.CHAT_APP_ID).replace(
      "REGION",
      process.env.CHAT_REGION
    ) + `users/${uid}`;
  const options = {
    method: "DELETE",
    body: JSON.stringify({ permanent: true }),
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      apikey: process.env.CHAT_API_KEY,
    },
  };

  return await fetch(url, options);
};


export const deActivateCometChatUser = async (uid) => {
  const url =
    process.env.CHAT_API_HOST.replace("APPID", process.env.CHAT_APP_ID).replace(
      "REGION",
      process.env.CHAT_REGION
    ) + `users`;
  const options = {
    method: "DELETE",
    body: JSON.stringify({
      uidsToDeactivate: [uid],
    }),
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      apikey: process.env.CHAT_API_KEY,
    },
  };

  return await fetch(url, options);
};

export const reActivateCometChatUser = async (uid) => {
  const url =
    process.env.CHAT_API_HOST.replace("APPID", process.env.CHAT_APP_ID).replace(
      "REGION",
      process.env.CHAT_REGION
    ) + `users`;
  const options = {
    method: "PUT",
    body: JSON.stringify({
      uidsToActivate: [uid],
    }),
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      apikey: process.env.CHAT_API_KEY,
    },
  };

  return await fetch(url, options);
};


export const deleteUserAndItsRecords = async (data, userId, models) => {

  /** Create an array of promises to run all operations in parallel */
  const promises = [];

  /** delete User */
  promises.push(models.Users.update(data, {
    where: { id: userId }
  }));

  /** delete Agent Groups */
  promises.push(models.AgentGroups.update(data, {
    where: { user_id: userId }
  }));

  /** delete Agent Group Members */
  promises.push(models.AgentGroupMembers.update(data, {
    where: { user_id: userId }
  }));

  /** delete assigned task users */
  promises.push(models.AssignedTaskUsers.update(data, {
    where: { user_id: userId }
  }));

  /** delete assigned users */
  promises.push(models.AssignedUsers.update(data, {
    where: {
      [Op.or]: [
        { user_id: userId },
        { agent_id: userId },
        { account_manager_id: userId }
      ]
    }
  }));

  /** delete password managers */
  promises.push(models.PasswordManager.update(data, {
    where: { user_id: userId }
  }));

  /** delete projects */
  promises.push(models.Projects.update(data, {
    where: { user_id: userId }
  }));

  /** delete shared files */
  promises.push(models.SharedFiles.update(data, {
    where: { client_id: userId }
  }));

  /** delete supports */
  promises.push(models.Supports.update(data, {
    where: { user_id: userId }
  }));

  /** delete tasks */
  promises.push(models.Tasks.update(data, {
    where: { user_id: userId }
  }));

  /** delete Subscriptions */
  promises.push(models.ClientSubscriptions.update(data, {
    where: { client_id: userId, status: { [Op.notIn]: [1, 2] } }
  }));

  /** Run all the update operations in parallel */
  await Promise.all(promises);
  await deleteCometChatUser(userId)
  /**  Get all task and support group ids of client */
  // let getGroupIds = await getAllUserGroups(models);

  // /** Remove group members in parallel if there are any group ids */
  // if (getGroupIds.length > 0) {
  //   const removeGroupMemberPromises = getGroupIds.map(groupId =>
  //     removeCometChatGroupMembers(groupId, userId)
  //       .then(res => res.json())
  //       .then(json => {
  //         console.log("Group Members removed...", json);
  //       })
  //       .catch(err => {
  //         console.error("Error in removing Group members:", err);
  //       })
  //   );

  //   /** Wait for all group member removals to finish */
  //   await Promise.all(removeGroupMemberPromises);
  // }

  return true;
};

/** Get all Task and support groups in commetChat */

export const getAllUserGroups = async (models) => {
  /** Create an array of promises for fetching task groups and support groups concurrently */
  const promises = [];

  /** Fetch task groups */
  const taskGroupsPromise = models.Tasks.findAll({
    attributes: ["id", "user_id", "guid", "deleted_at"],
    where: {
      guid: {
        [Op.ne]: null
      },
      deleted_at: null,
    },
    raw: true,
  });

  /** Fetch support groups */
  const supportGroupsPromise = models.Supports.findAll({
    attributes: ["id", "user_id", "deleted_at"],
    where: {
      deleted_at: null,
    },
    raw: true,
  });

  /** Add promises to the array */
  promises.push(taskGroupsPromise);
  promises.push(supportGroupsPromise);

  /** Execute all promises concurrently */
  const [allTaskGroups, getAllSupportGroups] = await Promise.all(promises);

  /** Process the results */
  let groupIds = [];

  if (allTaskGroups.length > 0) {
    let getTaskGroupIds = allTaskGroups.map(val => Number(val.guid));
    groupIds.push(...getTaskGroupIds);
  }

  if (getAllSupportGroups.length > 0) {
    let getSupportGroupIds = getAllSupportGroups.map(val => val.id);
    groupIds.push(...getSupportGroupIds);
  }

  return groupIds;
};



/* upload file common function*/
export const uploadPrivateFile = async (detail) => {
  const { files, id, folder } = detail;
  let generateFileKey;
  try {
    const uploadedFiles = [];
    for (const ele of files) {

      let getExtension = ele.mimetype.split("/")[1];
      const data = ele.buffer;

      generateFileKey = `rcw-${uuidv4()}.${getExtension}`;
      const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: `${folder}/${id}/${generateFileKey}`,
        Body: data,
        ContentType: ele.mimetype,
      };

      const result = await uploadFileToAWS(params);
      ele.location = result.Location;
      ele.key = result.Key;
    }
    if (files) {
      if (files.length > 0) {
        files.forEach((file) => {
          const upload = {
            path: file.location,
            type: file.mimetype,
            name: file.originalname,
            file_key: file.key,
            generate_file_key: generateFileKey
          };
          uploadedFiles.push(upload);
        });
      }
    }
    return uploadedFiles;
  } catch (error) {
    console.log(error, "======");
  }
};

export const generatePresignedUrl = async (fileName) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET, // Replace with your bucket name
    Key: fileName // File path in the S3 bucket
  });
  // Generate the pre-signed URL with an expiration time (1 hour in this case)
  return await getSignedUrl(s3, command, { expiresIn: 60 * 60 });
}

export const uploadPdfToS3 = async (url, subscriptionId) => {
  try {
    // Fetch the PDF as a stream
    const response = await axios.get(url, { responseType: 'stream' });
    let generateFileKey = `rcw-${uuidv4()}.pdf`;
    // Define upload parameters
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: process.env.AWS_BUCKET,
        Key: `Subscription-invoice/${subscriptionId}/${generateFileKey}`,
        Body: response.data,
        ACL: "public-read",
        ContentEncoding: "base64",
        ContentDisposition: "inline",
        ContentType: 'application/pdf', // Set content type to PDF
      },
    });
    // Monitor upload progress if desired
    upload.on("httpUploadProgress", (progress) => {
      console.log("Progress:", progress);
    });
    // Execute upload
    const result = await upload.done();
    console.log('Upload successful:', result);
    return result;
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw error;
  }
}

/** Send slack notifications  */
export const sendSlackNotification = async (webhookUrl, data) => {
  try {
    await axios.post(webhookUrl, data, {
      headers: { 'Content-Type': 'application/json' }
    })
      .then(function (response) {
        console.log(response.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  } catch (error) {
    console.error('Error in send notification:', error);
    throw error;
  }
}

export const addGoogleCalenderEvent = async (data) => {
  try {
    if (data.tokens) {
      // let tokens = JSON.parse(data.tokens);
      // let tokens = data.tokens
      oauth2Client.setCredentials({ refresh_token:data.tokens.refresh_token /* tokens.refresh_token */ });
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      var event = {
        'summary': data.event.title,
        // 'location': 'Hyderabad,India',
        'description': data.event.description,
        'start': {
          'dateTime': data.event.reminder_date,
          'timeZone': data.event.time_zone,
        },
        'end': {
          'dateTime': data.event.reminder_date,
          'timeZone': data.event.time_zone,
        },

        'attendees': [
          { 'email': data.event.email },
          // {'email': "satvindersahil@gmail.com"},
        ],
        'reminders': {
          'useDefault': false,
          'overrides': [
            { 'method': 'email', 'minutes': 24 * 60 },
            { 'method': 'popup', 'minutes': 10 },
          ],
        },
      };
      const auth = new google.auth.GoogleAuth({
        keyFile: calenderFile,
        scopes: 'https://www.googleapis.com/auth/calendar',
      });
      const eventStatus = await calendar.events.insert({
        calendarId: "primary",
        resource: event,
      }, ).then(response => { return { status: true, eventId: response.data.id }; }).catch(
        err => {
          console.error(' Error creating google creating event:', err);
          return { status: false, eventId: null };
        }
      )
      return eventStatus
    }
  } catch (err) {
    console.log(err, "===========");
    return true;
  }
};

export const getOutlookRefreshAccessToken = async (refreshToken) => {
  const accessToken = await axios.request({
    method: "post",
    url: "https://login.microsoftonline.com/consumers/oauth2/v2.0/token",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    data: {
      client_id: process.env.AZURE_CLIENT_ID,
      client_secret: process.env.AZURE_CLIENT_SECRET,
      redirect_uri: process.env.AZURE_REDIRECT_URI,
      grant_type: "refresh_token",
      refresh_token: refreshToken
    }
  })
  return accessToken.data.access_token

}




export const addOutLookCalenderEvent = async (data) => {
  try {
    const cleanedToken = data.token.replace(/^"|"$/g, '');
    const accessToken = await getOutlookRefreshAccessToken(cleanedToken)
    const event = {
      subject: data.event.title,
      body: {
        contentType: "text",
        content: data.event.description
      },
      start: { dateTime: data.event.reminder_date, timeZone: data.event.time_zone },
      end: { dateTime: data.event.reminder_date, timeZone: data.event.time_zone },
      location: { displayName: "Meeting" },
      attendees: [{ emailAddress: { address: data.event.email }, type: "required" }],
      allowNewTimeProposals: true,
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness'
    }
    const response = await axios.request({
      method: "post",
      url: "https://graph.microsoft.com/v1.0/me/events",
      headers: {
        Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json"
      },
      data: event
    })
    // console.log("response----", response)
    if (response && response.status == 201) {
      return { status: true, eventId: response.data.id };
    }
    return { status: false, eventId: null };
  } catch (err) {
    console.log(err, "===========");
    return { status: false, eventId: null };;
  }
}

export const updateGoogleCalenderEvent = async (data) => {
  try {
    if (data.tokens) {
      // let tokens = JSON.parse(data.tokens);
      // let tokens = data.tokens
      oauth2Client.setCredentials({ refresh_token: data.tokens.refresh_token/* tokens.refresh_token */ });
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      var event = {
        'summary': data.event.title,
        'description': data.event.description,
        'start': {
          'dateTime': data.event.reminder_date,
          'timeZone': data.event.time_zone,
        },
        'end': {
          'dateTime': data.event.reminder_date,
          'timeZone': data.event.time_zone,
        },

        'attendees': [
          { 'email': data.event.email },
        ],
        'reminders': {
          'useDefault': false,
          'overrides': [
            { 'method': 'email', 'minutes': 24 * 60 },
            { 'method': 'popup', 'minutes': 10 },
          ],
        },
      };

      calendar.events.update({
        calendarId: "primary",
        eventId: data.eventId,
        resource: event,
      }, function (err, event) {
        if (err) {
          console.log('There was an error contacting the Calendar service: ' + err);
          return false
        }
        console.log('Event updated: %s');
        return true;
      });

    }

  } catch (err) {
    console.log(err, "===========");
    return true;
  }

}

export const deleteGoogleCalenderEvent = async (data) => {
  try {
    if (data.token) {
      // let tokens = JSON.parse(data.token);
      // let tokens = data.tokens
      oauth2Client.setCredentials({ refresh_token: data.token.refresh_token /* tokens.refresh_token */ });
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
     const eventStatus=  await calendar.events.delete({
        calendarId: "primary",
        eventId: data.eventId,
      }).then(response => {
        if (response && response.status == 204) {
          return { status: true }
        } else {
          return { status: false }

        }
      }).catch(err => {
        console.error(' Error deleting google  event:', err);
        return { status: false };
      })
      return eventStatus
    }
  } catch (err) {
    console.log(err, "===========");
    return true;
  }
}

export const updateOutLookCalenderEvent = async (data) => {
  try {
    const cleanedToken = data.token.replace(/^"|"$/g, '');
    const accessToken = await getOutlookRefreshAccessToken(cleanedToken)
    const event = {
      subject: data.event.title,
      body: {
        contentType: "text",
        content: data.event.description
      },
      start: { dateTime: data.event.reminder_date, timeZone: data.event.time_zone },
      end: { dateTime: data.event.reminder_date, timeZone: data.event.time_zone },
      location: { displayName: "Meeting" },
      attendees: [{ emailAddress: { address: data.event.email }, type: "required" }],
      allowNewTimeProposals: true,
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness'
    }
    const response = await axios.request({
      method: "patch",
      url: `https://graph.microsoft.com/v1.0/me/events/${data.eventId}`,
      headers: {
        Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json"
      },
      data: event
    })
    if (response && response.status == 200) {
      return true
    }
    return false

  } catch (err) {
    console.log(err, "===========");
    return true;
  }
}
export const deleteOutLookCalenderEvent = async (data) => {
  try {
    const cleanedToken = data.token.replace(/^"|"$/g, '');
    const accessToken = await getOutlookRefreshAccessToken(cleanedToken)
    const response = await axios.request({
      method: "delete",
      url: `https://graph.microsoft.com/v1.0/me/events/${data.eventId}`,
      headers: {
        Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json"
      },
    })
    if (response && response.status ==204) {
      return true;
    }
    return false;
  } catch (err) {
    console.log(err, "===========");
    return false;
  }


}



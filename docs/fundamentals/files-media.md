# Files & Media Handling

A complete guide to sending, receiving, and managing files in Telegram bots.

---

## 📖 Table of Contents

1. [Sending Files](#sending-files)
2. [Receiving Files](#receiving-files)
3. [File Size Limits](#file-size-limits)
4. [Streaming vs Download](#streaming-vs-download)
5. [Media Groups](#media-groups)
6. [Voice & Video Notes](#voice--video-notes)

---

## Sending Files

Different ways to send files to users.

### Three Ways to Send Files

```
┌─────────────────────────────────────────────────────────────┐
│  1. By file_id (Fastest - file already on Telegram)         │
│     bot.sendPhoto(chatId, 'AgACAgIAAxk...')                 │
│                                                              │
│  2. By URL (Telegram downloads from URL)                    │
│     bot.sendPhoto(chatId, 'https://example.com/photo.jpg')  │
│                                                              │
│  3. By upload (Upload from local file/buffer)               │
│     bot.sendPhoto(chatId, fs.createReadStream('photo.jpg')) │
└─────────────────────────────────────────────────────────────┘
```

### Send Photo

```javascript
// By file_id (reuse previously uploaded)
await bot.sendPhoto(chatId, 'AgACAgIAAxkBAAI...');

// By URL
await bot.sendPhoto(chatId, 'https://example.com/photo.jpg');

// By file path
await bot.sendPhoto(chatId, './images/photo.jpg');

// By stream
const fs = require('fs');
await bot.sendPhoto(chatId, fs.createReadStream('./photo.jpg'));

// By buffer
const buffer = fs.readFileSync('./photo.jpg');
await bot.sendPhoto(chatId, buffer, {}, { filename: 'photo.jpg' });

// With options
await bot.sendPhoto(chatId, 'photo.jpg', {
  caption: 'Check out this photo!',
  parse_mode: 'HTML',
  has_spoiler: true,
  protect_content: true
});
```

### Send Document

```javascript
// Any file type
await bot.sendDocument(chatId, './file.pdf', {
  caption: 'Here is your document',
  disable_content_type_detection: false
});

// With custom filename
await bot.sendDocument(chatId, buffer, {
  caption: 'Report'
}, {
  filename: 'report_2024.pdf',
  contentType: 'application/pdf'
});

// With thumbnail
await bot.sendDocument(chatId, './file.pdf', {
  caption: 'Document with preview',
  thumb: './thumbnail.jpg'
});
```

### Send Video

```javascript
await bot.sendVideo(chatId, './video.mp4', {
  caption: 'Watch this!',
  duration: 120,
  width: 1920,
  height: 1080,
  supports_streaming: true,
  has_spoiler: false
});

// With thumbnail
await bot.sendVideo(chatId, './video.mp4', {
  thumb: './thumbnail.jpg'
});
```

### Send Audio

```javascript
await bot.sendAudio(chatId, './song.mp3', {
  caption: 'Great song!',
  duration: 240,
  performer: 'Artist Name',
  title: 'Song Title',
  thumb: './album_art.jpg'
});
```

### Send Voice

```javascript
// Voice messages (OGG format with OPUS codec)
await bot.sendVoice(chatId, './voice.ogg', {
  caption: 'Voice message',
  duration: 10
});
```

### Send Animation (GIF)

```javascript
await bot.sendAnimation(chatId, './animation.gif', {
  caption: 'Funny GIF!',
  width: 320,
  height: 240,
  duration: 5
});
```

### Send Sticker

```javascript
// By file_id
await bot.sendSticker(chatId, 'CAACAgIAAxk...');

// By URL (WebP, TGS, or WebM)
await bot.sendSticker(chatId, 'https://example.com/sticker.webp');
```

### Reusing file_id

```javascript
// Store file_id after first upload
const sentMsg = await bot.sendPhoto(chatId, './photo.jpg');
const fileId = sentMsg.photo[sentMsg.photo.length - 1].file_id;

// Save fileId to database
await saveFileId('photo_1', fileId);

// Later, send using file_id (instant, no re-upload)
const cachedFileId = await getFileId('photo_1');
await bot.sendPhoto(anotherChatId, cachedFileId);
```

### File Options Reference

| Option | Type | Description |
|--------|------|-------------|
| `caption` | String | Caption (0-1024 chars) |
| `parse_mode` | String | HTML or MarkdownV2 |
| `caption_entities` | Array | Special entities in caption |
| `disable_notification` | Boolean | Send silently |
| `protect_content` | Boolean | Prevent forwarding/saving |
| `reply_to_message_id` | Integer | Reply to message |
| `has_spoiler` | Boolean | Blur media (photo/video) |

---

## Receiving Files

Handling files sent by users.

### Detecting File Messages

```javascript
bot.on('message', async (msg) => {
  if (msg.photo) {
    await handlePhoto(msg);
  } else if (msg.document) {
    await handleDocument(msg);
  } else if (msg.video) {
    await handleVideo(msg);
  } else if (msg.audio) {
    await handleAudio(msg);
  } else if (msg.voice) {
    await handleVoice(msg);
  } else if (msg.video_note) {
    await handleVideoNote(msg);
  } else if (msg.sticker) {
    await handleSticker(msg);
  } else if (msg.animation) {
    await handleAnimation(msg);
  }
});
```

### Handling Photos

```javascript
bot.on('photo', async (msg) => {
  // Photos come in multiple sizes
  const photos = msg.photo;
  
  // Get different sizes
  const smallest = photos[0];
  const largest = photos[photos.length - 1];
  
  console.log('Photo sizes:');
  photos.forEach((photo, i) => {
    console.log(`  ${i}: ${photo.width}x${photo.height} - ${photo.file_size} bytes`);
  });
  
  // Usually want the largest
  const fileId = largest.file_id;
  const fileUniqueId = largest.file_unique_id;
  
  // Download the file
  const filePath = await bot.downloadFile(fileId, './downloads/');
  console.log('Downloaded to:', filePath);
});
```

### Handling Documents

```javascript
bot.on('document', async (msg) => {
  const doc = msg.document;
  
  console.log('Document received:');
  console.log('  File name:', doc.file_name);
  console.log('  MIME type:', doc.mime_type);
  console.log('  Size:', doc.file_size, 'bytes');
  console.log('  File ID:', doc.file_id);
  
  // Check file type
  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
  if (!allowedTypes.includes(doc.mime_type)) {
    return bot.sendMessage(msg.chat.id, '❌ File type not allowed');
  }
  
  // Check file size (e.g., max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (doc.file_size > maxSize) {
    return bot.sendMessage(msg.chat.id, '❌ File too large (max 10MB)');
  }
  
  // Download
  const filePath = await bot.downloadFile(doc.file_id, './downloads/');
  await bot.sendMessage(msg.chat.id, '✅ File received and saved!');
});
```

### Getting File Info

```javascript
async function getFileInfo(fileId) {
  const file = await bot.getFile(fileId);
  
  return {
    fileId: file.file_id,
    fileUniqueId: file.file_unique_id,
    fileSize: file.file_size,
    filePath: file.file_path  // Relative path on Telegram servers
  };
}

// Get download URL
async function getFileUrl(fileId) {
  const file = await bot.getFile(fileId);
  const token = process.env.TELEGRAM_BOT_TOKEN;
  return `https://api.telegram.org/file/bot${token}/${file.file_path}`;
}
```

### Download File

```javascript
// Download to directory
const localPath = await bot.downloadFile(fileId, './downloads/');

// Download to specific filename
const fs = require('fs');
const https = require('https');

async function downloadToFile(fileId, outputPath) {
  const file = await bot.getFile(fileId);
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
  
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(outputPath);
    https.get(url, (response) => {
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(outputPath);
      });
    }).on('error', reject);
  });
}
```

### Download to Buffer (Memory)

```javascript
const axios = require('axios');

async function downloadToBuffer(fileId) {
  const file = await bot.getFile(fileId);
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
  
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

// Usage
bot.on('photo', async (msg) => {
  const fileId = msg.photo[msg.photo.length - 1].file_id;
  const buffer = await downloadToBuffer(fileId);
  
  // Process buffer (e.g., image manipulation)
  const processedImage = await processImage(buffer);
});
```

---

## File Size Limits

Understanding Telegram's file size restrictions.

### Bot API Limits

```
┌─────────────────────────────────────────────────────────────┐
│                    FILE SIZE LIMITS                          │
├─────────────────────────────────────────────────────────────┤
│  Download (getFile):     20 MB maximum                      │
│  Upload (sendDocument):  50 MB maximum                      │
│                                                              │
│  Photo upload:           10 MB (compressed to JPEG)         │
│  Photo dimensions:       10000 total (width + height)       │
│                                                              │
│  Sticker (WebP):         512 KB                             │
│  Animated sticker:       64 KB                              │
│  Video sticker:          256 KB                             │
│                                                              │
│  Thumbnail:              200 KB, 320x320 max                │
└─────────────────────────────────────────────────────────────┘
```

### Handling Large Files

```javascript
bot.on('document', async (msg) => {
  const doc = msg.document;
  
  // Check if file is too large to download via Bot API
  if (doc.file_size > 20 * 1024 * 1024) {
    await bot.sendMessage(msg.chat.id,
      '⚠️ File is larger than 20MB.\n' +
      'I can only download files up to 20MB via Bot API.'
    );
    return;
  }
  
  // Proceed with download
  const filePath = await bot.downloadFile(doc.file_id, './downloads/');
});
```

### Compressing Before Upload

```javascript
const sharp = require('sharp');

async function compressImage(inputBuffer, maxSizeMB = 10) {
  let quality = 90;
  let output = inputBuffer;
  
  while (output.length > maxSizeMB * 1024 * 1024 && quality > 10) {
    output = await sharp(inputBuffer)
      .jpeg({ quality })
      .toBuffer();
    quality -= 10;
  }
  
  return output;
}

// Usage
bot.on('photo', async (msg) => {
  const buffer = await downloadToBuffer(msg.photo[msg.photo.length - 1].file_id);
  const compressed = await compressImage(buffer, 5);
  
  // Now safe to process or re-upload
});
```

### Chunked Upload for Large Files

For files > 50MB, you need to use Telegram's local Bot API server or MTProto:

```javascript
// Option 1: Use local Bot API server
// https://github.com/tdlib/telegram-bot-api

// Option 2: Split file (for certain use cases)
async function splitFile(filePath, chunkSize) {
  const fs = require('fs');
  const chunks = [];
  const buffer = fs.readFileSync(filePath);
  
  for (let i = 0; i < buffer.length; i += chunkSize) {
    chunks.push(buffer.slice(i, i + chunkSize));
  }
  
  return chunks;
}
```

---

## Streaming vs Download

Choosing between streaming and full download.

### Full Download (Simple)

```javascript
// Download entire file to disk
const localPath = await bot.downloadFile(fileId, './downloads/');

// Then process
const data = fs.readFileSync(localPath);
processFile(data);
fs.unlinkSync(localPath); // Clean up
```

**Pros:**
- Simple to implement
- File persists for multiple operations

**Cons:**
- Uses disk space
- Slower for large files
- Need to clean up

### Streaming (Efficient)

```javascript
const https = require('https');
const { pipeline } = require('stream/promises');

async function streamFile(fileId, destination) {
  const file = await bot.getFile(fileId);
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
  
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      pipeline(response, destination)
        .then(resolve)
        .catch(reject);
    }).on('error', reject);
  });
}

// Stream to file
const writeStream = fs.createWriteStream('./output.pdf');
await streamFile(fileId, writeStream);

// Stream to processing
const { Transform } = require('stream');
const processor = new Transform({
  transform(chunk, encoding, callback) {
    // Process chunk
    callback(null, processChunk(chunk));
  }
});
await streamFile(fileId, processor);
```

### Stream to Cloud Storage

```javascript
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

async function uploadToGCS(fileId, bucketName, destFileName) {
  const file = await bot.getFile(fileId);
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
  
  const bucket = storage.bucket(bucketName);
  const blob = bucket.file(destFileName);
  const blobStream = blob.createWriteStream();
  
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      response.pipe(blobStream)
        .on('finish', resolve)
        .on('error', reject);
    });
  });
}

// Usage
bot.on('document', async (msg) => {
  await uploadToGCS(
    msg.document.file_id,
    'my-bucket',
    `uploads/${msg.document.file_name}`
  );
  
  await bot.sendMessage(msg.chat.id, '✅ File uploaded to cloud!');
});
```

### Stream Processing Pipeline

```javascript
const { Transform } = require('stream');

// Create processing pipeline
function createProcessingPipeline() {
  const counter = new Transform({
    transform(chunk, encoding, callback) {
      this.bytes = (this.bytes || 0) + chunk.length;
      callback(null, chunk);
    }
  });
  
  const logger = new Transform({
    transform(chunk, encoding, callback) {
      console.log(`Processing ${chunk.length} bytes...`);
      callback(null, chunk);
    }
  });
  
  return { counter, logger };
}

// Use pipeline
async function processFileStream(fileId) {
  const { counter, logger } = createProcessingPipeline();
  const output = fs.createWriteStream('./processed.bin');
  
  const file = await bot.getFile(fileId);
  const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
  
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      response
        .pipe(counter)
        .pipe(logger)
        .pipe(output)
        .on('finish', () => resolve(counter.bytes))
        .on('error', reject);
    });
  });
}
```

---

## Media Groups

Sending multiple media items as an album.

### Send Media Group

```javascript
// Send multiple photos as album
await bot.sendMediaGroup(chatId, [
  {
    type: 'photo',
    media: 'https://example.com/photo1.jpg',
    caption: 'First photo'
  },
  {
    type: 'photo',
    media: 'https://example.com/photo2.jpg'
  },
  {
    type: 'photo',
    media: 'https://example.com/photo3.jpg',
    caption: 'Last photo'  // Only first and last can have captions
  }
]);
```

### Mixed Media Group

```javascript
// Photos and videos can be mixed
await bot.sendMediaGroup(chatId, [
  {
    type: 'photo',
    media: 'photo1.jpg',
    caption: 'Album caption'
  },
  {
    type: 'video',
    media: 'video1.mp4'
  },
  {
    type: 'photo',
    media: 'photo2.jpg'
  }
]);

// Documents must be separate
await bot.sendMediaGroup(chatId, [
  {
    type: 'document',
    media: 'file1.pdf',
    caption: 'Documents'
  },
  {
    type: 'document',
    media: 'file2.pdf'
  }
]);

// Audio must be separate
await bot.sendMediaGroup(chatId, [
  {
    type: 'audio',
    media: 'song1.mp3',
    caption: 'Playlist'
  },
  {
    type: 'audio',
    media: 'song2.mp3'
  }
]);
```

### Upload Files in Media Group

```javascript
const fs = require('fs');

await bot.sendMediaGroup(chatId, [
  {
    type: 'photo',
    media: 'attach://photo1',
    caption: 'Uploaded photos'
  },
  {
    type: 'photo',
    media: 'attach://photo2'
  }
], {
  photo1: fs.createReadStream('./photo1.jpg'),
  photo2: fs.createReadStream('./photo2.jpg')
});
```

### Receive Media Group

```javascript
const mediaGroups = new Map();

bot.on('message', async (msg) => {
  if (msg.media_group_id) {
    // Part of a media group
    const groupId = msg.media_group_id;
    
    if (!mediaGroups.has(groupId)) {
      mediaGroups.set(groupId, []);
    }
    
    mediaGroups.get(groupId).push(msg);
    
    // Process after a short delay (all messages arrive quickly)
    clearTimeout(mediaGroups.get(groupId).timeout);
    mediaGroups.get(groupId).timeout = setTimeout(() => {
      const messages = mediaGroups.get(groupId);
      console.log(`Received album with ${messages.length} items`);
      
      // Process all items
      messages.forEach(m => {
        if (m.photo) console.log('Photo:', m.photo[m.photo.length - 1].file_id);
        if (m.video) console.log('Video:', m.video.file_id);
        if (m.document) console.log('Document:', m.document.file_id);
      });
      
      mediaGroups.delete(groupId);
    }, 500);
  }
});
```

### Media Group Limits

| Limit | Value |
|-------|-------|
| Items per group | 2-10 |
| Total size | 50 MB |
| Caption | Only on first item |
| Types | Can't mix documents with photos/videos |

---

## Voice & Video Notes

Handling voice messages and circular video notes.

### Sending Voice Messages

```javascript
// Voice must be OGG with OPUS codec
await bot.sendVoice(chatId, './voice.ogg', {
  caption: 'Listen to this!',
  duration: 10  // Duration in seconds
});

// Convert MP3 to OGG (using ffmpeg)
const { exec } = require('child_process');

async function convertToOgg(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    exec(
      `ffmpeg -i ${inputPath} -c:a libopus ${outputPath}`,
      (error) => error ? reject(error) : resolve(outputPath)
    );
  });
}

// Usage
const oggPath = await convertToOgg('./audio.mp3', './voice.ogg');
await bot.sendVoice(chatId, oggPath);
```

### Receiving Voice Messages

```javascript
bot.on('voice', async (msg) => {
  const voice = msg.voice;
  
  console.log('Voice message:');
  console.log('  Duration:', voice.duration, 'seconds');
  console.log('  MIME type:', voice.mime_type);
  console.log('  Size:', voice.file_size, 'bytes');
  
  // Download voice
  const filePath = await bot.downloadFile(voice.file_id, './downloads/');
  
  // Transcribe (example with external service)
  const transcription = await transcribeAudio(filePath);
  await bot.sendMessage(msg.chat.id, `📝 Transcription:\n${transcription}`);
});
```

### Sending Video Notes

```javascript
// Video notes are circular, max 1 minute
await bot.sendVideoNote(chatId, './video_note.mp4', {
  duration: 30,
  length: 240,  // Video width and height (must be equal, max 640)
  thumb: './thumbnail.jpg'
});

// Create circular video note from regular video
async function createVideoNote(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    exec(
      `ffmpeg -i ${inputPath} -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=240:240" -t 60 -c:v libx264 -c:a aac ${outputPath}`,
      (error) => error ? reject(error) : resolve(outputPath)
    );
  });
}
```

### Receiving Video Notes

```javascript
bot.on('video_note', async (msg) => {
  const videoNote = msg.video_note;
  
  console.log('Video note:');
  console.log('  Duration:', videoNote.duration, 'seconds');
  console.log('  Length:', videoNote.length, 'pixels');
  console.log('  Size:', videoNote.file_size, 'bytes');
  
  if (videoNote.thumb) {
    console.log('  Has thumbnail');
  }
  
  // Download
  const filePath = await bot.downloadFile(videoNote.file_id, './downloads/');
  
  // Process video note...
});
```

### Voice/Video Note Processing Pipeline

```javascript
const ffmpeg = require('fluent-ffmpeg');

// Transcribe voice message
async function processVoice(msg) {
  const voicePath = await bot.downloadFile(msg.voice.file_id, './temp/');
  
  // Convert to WAV for processing
  const wavPath = voicePath.replace('.oga', '.wav');
  
  await new Promise((resolve, reject) => {
    ffmpeg(voicePath)
      .toFormat('wav')
      .on('end', resolve)
      .on('error', reject)
      .save(wavPath);
  });
  
  // Send to speech-to-text service
  const text = await speechToText(wavPath);
  
  // Cleanup
  fs.unlinkSync(voicePath);
  fs.unlinkSync(wavPath);
  
  return text;
}

// Extract frame from video note
async function extractVideoNoteFrame(msg) {
  const videoPath = await bot.downloadFile(msg.video_note.file_id, './temp/');
  const framePath = videoPath.replace('.mp4', '.jpg');
  
  await new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        count: 1,
        folder: './temp/',
        filename: path.basename(framePath)
      })
      .on('end', resolve)
      .on('error', reject);
  });
  
  return framePath;
}
```

---

## Quick Reference

```javascript
// Send files
await bot.sendPhoto(chatId, 'photo.jpg', { caption: 'Caption' });
await bot.sendDocument(chatId, 'file.pdf');
await bot.sendVideo(chatId, 'video.mp4');
await bot.sendAudio(chatId, 'audio.mp3');
await bot.sendVoice(chatId, 'voice.ogg');
await bot.sendVideoNote(chatId, 'note.mp4');
await bot.sendSticker(chatId, 'sticker.webp');
await bot.sendAnimation(chatId, 'animation.gif');

// Media group
await bot.sendMediaGroup(chatId, [
  { type: 'photo', media: 'photo1.jpg', caption: 'Album' },
  { type: 'photo', media: 'photo2.jpg' }
]);

// Get file info
const file = await bot.getFile(fileId);

// Download file
const path = await bot.downloadFile(fileId, './downloads/');

// Get download URL
const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

// File size limits
// Download: 20 MB
// Upload: 50 MB
// Photo: 10 MB
```


Event Name Emitter Target Payload Purpose
join:project Client Server string (projectId) Request to join a project's real-time room.
leave:project Client Server string (projectId) Inform server that user is leaving a room.
chat:message Client Server { projectId, text } Send a new chat message to a project room.
cursor:move Client Server { projectId, x, y } Send the user's current cursor position.
call:offer Client Server { to, offer } Send a WebRTC offer to a specific user.
call:answer Client Server { to, answer } Send a WebRTC answer to a specific user.
call:end Client Server { to } Notify a specific user that the call has ended.
room:active Server Project Room (none) Inform clients that 2+ users are present.
room:waiting Server Socket ID (none) Inform a client that they are alone in the room.
user:joined Server Project Room { userId, userName } Notify room members that a new user has joined.
user:left Server Project Room { userId } Notify room members that a user has left.
chat:message Server Project Room { user, message, timestamp } Broadcast a chat message to all room members.
chat:clear Server Project Room (none) Tell clients to clear chat when room is no longer active.
cursor:move Server Project Room { user, position } Broadcast a user's cursor position.
cursor:leave Server Project Room { userId } Tell clients to remove a user's cursor.
tasks:updated Server Project Room Task[] (full list) Broadcast the new, authoritative list of tasks.
project:updated Server Project Room Project (full object) Broadcast the new, authoritative project details.
project:deleted Server Project Room { projectId } Notify members that a project was deleted.
kicked:from_project Server Socket ID { projectId, projectName } Privately notify a user they were removed.
invitation:new Server Socket ID (none) Privately notify a user of a new invitation.
invitation:accepted Server Socket ID { projectName, recipientName } Privately notify an inviter their invite was accepted.
invitation:declined Server Socket ID { projectName, recipientName } Privately notify an inviter their invite was declined.
dashboard:refetch Server Socket ID (none) Privately tell a user to refetch dashboard data.
call:offer Server Socket ID { from, offer } Forward a WebRTC offer to a specific user.
call:answer Server Socket ID { from, answer } Forward a WebRTC answer to a specific user.
call:end Server Socket ID { from } Forward a call termination signal.

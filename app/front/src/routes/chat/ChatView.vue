<template>
  <div class="container">
    <div>
      Status połączenia:
      <span v-show="!wsConnectionStore.isConnected" @click="connectAgain()">
        <i class="bi bi-share"></i> Niepołączono
        <span v-if="wsConnectionStore.remainAttempts > 0" class="fst-italic">(zaraz nastąpi próba ponownego
          połączenia)</span>
        <span v-else class="fst-italic">(kliknij, aby wymusić ponowne połączenie)</span>
      </span>
      <span v-show="wsConnectionStore.isConnected">
        <i class="bi bi-share-fill"></i> Połączono
      </span>
    </div>
    <div>
      <div class="row">
        <div v-if="currentRoom && currentRoom.id == 'lobby'" class="col-6">
          <h2 class="text-center">LOBBY</h2>
          <p class="text-center">Wybierz pokój, do którego chcesz dołączyć, stwórz nowy lub czatuj w lobby.</p>
          <div class="d-flex justify-content-center mb-3">
            <button class="btn btn-primary me-2" @click="createRoom">Stwórz nowy pokój</button>
          </div>
          <div v-if="roomList.length === 0" class="text-center text-muted">Brak widocznych pokoi. Stwórz nowy lub
            poczekaj aż jakiś się pojawi.</div>
          <ul class="list-group" v-else>
            <li v-for="room in roomList" :key="room.id" :title="`Room ID: ${room.id}`"
              class="list-group-item d-flex justify-content-between align-items-center">
              Oczekuje na osoby... ({{ room.players }}/{{ room.maxPlayers }})
              <button class="btn btn-success btn-sm" @click="joinRoom(room.id)"
                :disabled="room.players >= room.maxPlayers">Dołącz</button>
            </li>
          </ul>
        </div>
        <div v-else-if="currentRoom" class="col-6">
          <button class="btn btn-success btn-sm w-100" @click="leaveRoom()">Opuść pokój</button>
        </div>
        <div v-else class="col-6">
          ...
        </div>

        <div class="col-6">
          Osoby w pokoju<span v-if="currentRoom && currentRoom.maxPlayers !== undefined"> ({{ currentRoom.users.length }}/{{ currentRoom.maxPlayers }})</span>:
          <div v-if="currentRoom?.users.length === 0" class="text-center text-muted">Brak osoby w obecnym pokoju.</div>
          <ul class="list-group" v-else>
            <li v-for="user in currentRoom?.users" :key="user.id" :title="`ID: ${user}`"
              class="list-group-item d-flex justify-content-between align-items-center">
              <!-- {{ user.name }} ({{ user }}) -->
              {{ users[user]?.name ?? user }}
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div>
      <ul ref="messagesList" class="list-group overflow-auto position-relative rounded-0" style="max-height: 200px;">
        <li class="list-group-item p-0 border-0 sticky-top">
          <form @submit="sendRoomMessage" class="input-group rounded-0">
            <input type="text" class="form-control rounded-0" placeholder="Wpisz wiadomość..."
              v-model="roomMessageInput" />
            <button class="btn btn-primary rounded-0" type="submit">Wyślij</button>
          </form>
        </li>
        <li v-for="message in messages" :key="message.id"
          class="list-group-item d-flex justify-content-between align-items-start">
          <div v-if="message.type == 'chat'">
            <span class="fw-bold me-1">{{ message.data.user }}:</span>
            <span class="">{{ message.data.message }}</span>
          </div>
          <div v-else-if="message.type == 'userJoin'">
            <span class="fw-bold text-primary me-1">{{ message.data.user }} dołączył do czatu.</span>
          </div>
          <div v-else-if="message.type == 'userLeave'">
            <span class="fw-bold text-primary me-1">{{ message.data.user }} opuścił czat.</span>
          </div>
          <div v-else-if="message.type == 'userChanged'">
            <span class="fw-bold text-primary me-1">{{ message.data.oldUser }} zmienił nick na {{
              message.data.newUser }}.</span>
          </div>
          <div v-else>
            <span class="text-info me-1">{{ message }}</span>
          </div>
          <span class="badge text-bg-primary rounded-pill me-1"><span class="font-monospace">{{ timeString(message.receivedTime)}}</span></span>
        </li>
        <li v-if="messages.length === 0" class="list-group-item d-flex justify-content-between align-items-start">
          <div>
            <span class="badge text-bg-primary rounded-pill me-1">
              <span class="font-monospace">Informacja</span>
            </span>
            <span>Brak wiadomości w pokoju.</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { arrayRemoveElement, timeString } from '@/functions/Utils';
import { useAuthStore } from '@/stores/auth';
import { useWsConnectionStore } from '@/stores/wsConnectionStore';

export default {
  name: 'ChatView',
  data() {
    return {
      authStore: useAuthStore(),
      wsConnectionStore: useWsConnectionStore(),

      currentRoom: null,
      roomList: [],
      users: {},
      messages: [],
      roomMessageInput: '',
    };
  },
  computed: {
  },
  methods: {
    timeString,

    sendRoomMessage(event) {
      event.preventDefault();

      if (this.roomMessageInput.trim() === '') {
        this.roomMessageInput = '';
        return;
      }

      this.sendWsData('chat', { message: this.roomMessageInput });
      this.roomMessageInput = '';
    },
    joinRoom(roomId) {
      this.sendWsData('joinRoom', { roomId: roomId });
    },
    leaveRoom() {
      this.sendWsData('leaveRoom', {});
    },
    pushMessage(message) {
      message.receivedTime = new Date();
      this.messages.push(message);
      this.$nextTick(() => {
        this.$refs.messagesList.scrollTop = this.$refs.messagesList.scrollHeight;
      });
    },
    messageHandler(data) {
      try {
        data = JSON.parse(data);
      } catch (error) {
        console.warn('Nie można sparsować danych z serwera: ', data);
        return;
      }
      if (data.type === 'disconnect') {
        if (data.data?.reason === 'loggedFromAnotherPlace') {
          this.wsConnectionStore.disconnect(true);
          // this.$router.push('/guest');
          // alert('Zostałeś wylogowany, ponieważ zalogowano się na Twoje konto z innego miejsca.');
        }
      } else if (data.type === 'chat') {
        if (data.data?.user !== undefined && data.data?.message !== undefined) {
          this.pushMessage({ type: 'chat', data: { user: data.data.user, message: data.data.message } });
        }
      } else if (data.type === 'userChanged') {
        if (data.data?.user !== undefined) {
          if (this.users[data.data.user.id].name !== data?.data?.user.name)
            this.pushMessage({ type: 'userChanged', data: { oldUser: this.users[data.data.user.id].name, newUser: data?.data?.user.name } });
          this.users[data.data.user.id] = data.data.user;
        }
      } else if (data.type === 'userJoin') {
        if (data.data?.user !== undefined) {
          this.users[data.data.user.id] = data.data.user;
          this.currentRoom.users.push(data.data.user.id);
          this.pushMessage({ type: 'userJoin', data: { user: data?.data?.user.name } });
        }
      } else if (data.type === 'userLeave') {
        if (data.data?.userId !== undefined && this.users[data.data.userId] !== undefined) {
          this.pushMessage({ type: 'userLeave', data: { user: this.users[data.data.userId].name } });
          arrayRemoveElement(this.currentRoom.users, data.data.userId);
          delete this.users[data.data.userId];
        }
      } else if (data.type === 'privateRoomChangedStatus') {
        if (data.data?.room !== undefined) {
          this.roomList = this.roomList.map(room => {
            if (room.id === data.data.room.id) {
              return {
                ...room,
                players: data.data.room.players,
              };
            }
            return room;
          });
        }
      } else if (data.type === 'roomData') {
        if (data.data?.room !== undefined) {
          this.currentRoom = {
            ...data.data.room,
            // id: data.data.room.id,
            // maxPlayers: data.data.room.maxPlayers,
            users: data.data.room.users.map(user => {
              this.users[user.id] = user;
              return user.id;
            }),
          };
        }
      } else if (data.type === 'lobbyData') {
        if (data.data?.roomList !== undefined)
          this.roomList = data.data.roomList;
        // if(data.data?.users !== undefined)
        //   this.users = data.data.users;
        // if(data.data?.lobbyUsers !== undefined)
        //   this.users = data.data.lobbyUsers;
      } else {
        console.log('Otrzymano nieobsłużoną wiadomość z serwera: ', data);
      }
    },
    sendWsData(type, sendData) {
      if (!this.wsConnectionStore.isConnected) {
        return false;
      }
      var socketMessage = JSON.stringify({ type: type, data: sendData });
      this.wsConnectionStore.send(socketMessage);
      return true;
    },
    wsInit(url = null, autoReconnectTime = 5000, attempts = 5) {
      if (!url) {
        url = document.location.origin.replace('http', 'ws');
        url = url.replace('5173', '8888');
        // url = window.location.origin.replace(/^http/, 'ws') + '/ws';
      }
      this.wsConnectionStore = useWsConnectionStore().init(url, autoReconnectTime, attempts);
      this.wsConnectionStore.bind('open', () => {
        console.info('wsConnector opened');
      });
      this.wsConnectionStore.bind('close', () => {
        console.warn('wsConnector closed');
        this.currentRoom = null;

        if (this.wsConnectionStore.remainAttempts == this.wsConnectionStore.attempts) {
          // this.toastsStore.addToast({
          //     titleText: "WsConnector",
          //     bodyText: "Brak połączenia z aplikacją wsConnector, włącz wsConnector, aby móc korzystać z funkcji połączeń"
          // });
        }
      });
      this.wsConnectionStore.bind('error', console.warn);
      this.wsConnectionStore.bind('message', this.messageHandler);
      this.wsConnectionStore.connect();
    },
    connectAgain() {
      if (this.wsConnectionStore && this.wsConnectionStore.remainAttempts <= 0) {
        this.wsConnectionStore.connect();
      }
    },
  },
  async mounted() {
    await this.authStore.check();

    if (!this.authStore.isAuthenticated) {
      this.$router.push('/guest');
      return;
    }

    this.wsInit();
  },
  unmounted() {
    if (this.wsConnectionStore)
      this.sendWsData('leaveRoom', {});
    this.wsConnectionStore.disconnect(true);
  },
}
</script>

<style scoped>
#canvas {
  display: block;
  background-color: #fff;
  width: 1000px;
  height: 600px;
  margin: 20px auto;
  /* margin-top: 300px; */
}
</style>
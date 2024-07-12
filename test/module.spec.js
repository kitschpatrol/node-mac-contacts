const { describe, it, beforeEach, afterEach } = require('node:test')
const assert = require('assert')

const {
  getAuthStatus,
  getContactsByName,
  getAllContacts,
  addNewContact,
  deleteContact,
  updateContact,
  listener,
  requestAccess,
} = require('../index')

const isReadOnly = process.env.TEST_READONLY ?? false
const isCI = require('is-ci')
const ifit = (condition) => (condition ? it : it.skip)
const ifdescribe = (condition) => (condition ? describe : describe.skip)

describe('node-mac-contacts', () => {
  beforeEach(async () => {
    if (!isCI) {
      const status = await requestAccess()
      if (status !== 'Authorized') {
        console.error('Access to Contacts not authorized - cannot proceed.')
        process.exit(1)
      }
    }
  })

  describe('getAuthStatus()', () => {
    it('should not throw', () => {
      assert.doesNotThrow(() => {
        getAuthStatus()
      })
    })

    it('should return a string', () => {
      const status = getAuthStatus()
      assert.strictEqual(typeof status, 'string')
    })
  })

  describe('getAllContacts([extraProperties])', () => {
    it('should return an array', () => {
      const contacts = getAllContacts()
      assert(Array.isArray(contacts))
    })

    it('should throw if extraProperties is not an array', () => {
      assert.throws(() => {
        getAllContacts('tsk-bad-array')
      }, /extraProperties must be an array/)
    })

    it('should throw if extraProperties contains invalid properties', () => {
      const errorMessage =
        'properties in extraProperties must be one of jobTitle, departmentName, organizationName, middleName, note, contactImage, contactThumbnailImage, instantMessageAddresses, socialProfiles, urlAddresses'

      assert.throws(() => {
        getAllContacts(['bad-property'])
      }, new RegExp(errorMessage))
    })
  })

  describe('addNewContact(contact)', () => {
    ifit(!isReadOnly)('throws if contact is not a nonempty object', () => {
      assert.throws(() => {
        addNewContact(1)
      }, /contact must be a non-empty object/)

      assert.throws(() => {
        addNewContact({})
      }, /contact must be a non-empty object/)
    })

    ifit(!isReadOnly)('should throw if name properties are not strings', () => {
      assert.throws(() => {
        addNewContact({ firstName: 1 })
      }, /firstName must be a string/)

      assert.throws(() => {
        addNewContact({ lastName: 1 })
      }, /lastName must be a string/)

      assert.throws(() => {
        addNewContact({ nickname: 1 })
      }, /nickname must be a string/)
    })

    ifit(!isReadOnly)(
      'should throw if birthday is not a string in YYYY-MM-DD format',
      () => {
        assert.throws(() => {
          addNewContact({ birthday: 1 })
        }, /birthday must be a string/)

        assert.throws(() => {
          addNewContact({ birthday: '01-01-1970' })
        }, /birthday must use YYYY-MM-DD format/)
      },
    )

    ifit(!isReadOnly)('should throw if phoneNumbers is not an array', () => {
      assert.throws(() => {
        addNewContact({ phoneNumbers: 1 })
      }, /phoneNumbers must be an array/)
    })

    ifit(!isReadOnly)('should throw if emailAddresses is not an array', () => {
      assert.throws(() => {
        addNewContact({ emailAddresses: 1 })
      }, /emailAddresses must be an array/)
    })

    ifit(!isCI && !isReadOnly)('should successfully add a contact', () => {
      const success = addNewContact({
        firstName: 'William',
        lastName: 'Grapeseed',
        nickname: 'Billy',
        birthday: '1990-09-09',
        phoneNumbers: ['+1234567890'],
        emailAddresses: ['billy@grapeseed.com'],
      })

      assert.strictEqual(success, true)
    })
  })

  describe('getContactsByName(name[, extraProperties])', () => {
    it('should throw if name is not a string', () => {
      assert.throws(() => {
        getContactsByName(12345)
      }, /name must be a string/)
    })

    it('should throw if extraProperties is not an array', () => {
      assert.throws(() => {
        getContactsByName('jim-bob', 12345)
      }, /extraProperties must be an array/)
    })

    it('should throw if extraProperties contains invalid properties', () => {
      const errorMessage =
        'properties in extraProperties must be one of jobTitle, departmentName, organizationName, middleName, note, contactImage, contactThumbnailImage, instantMessageAddresses, socialProfiles, urlAddresses'

      assert.throws(() => {
        getContactsByName('jim-bob', ['bad-property'])
      }, new RegExp(errorMessage))
    })

    ifit(!isCI && !isReadOnly)(
      'should retrieve a contact by name predicates',
      () => {
        addNewContact({
          firstName: 'Sherlock',
          lastName: 'Holmes',
          nickname: 'Sherllock',
          birthday: '1854-01-06',
          phoneNumbers: ['+1234567890'],
          emailAddresses: ['sherlock@holmes.com'],
        })

        const contacts = getContactsByName('Sherlock Holmes')
        assert(Array.isArray(contacts))
        assert(contacts.length >= 1)

        const contact = contacts[0]
        assert.strictEqual(contact.firstName, 'Sherlock')
      },
    )
  })

  describe('deleteContact({ name, identifier })', () => {
    ifit(!isReadOnly)('should throw if name is not a string', () => {
      assert.throws(() => {
        deleteContact({ name: 12345 })
      }, /name must be a string/)
    })

    ifit(!isReadOnly)('should throw if identifier is not a string', () => {
      assert.throws(() => {
        deleteContact({ identifier: 12345 })
      }, /identifier must be a string/)
    })
  })

  describe('updateContact(contact)', () => {
    ifit(!isReadOnly)('throws if contact is not a nonempty object', () => {
      assert.throws(() => {
        updateContact(1)
      }, /contact must be a non-empty object/)

      assert.throws(() => {
        updateContact({})
      }, /contact must be a non-empty object/)
    })

    ifit(!isReadOnly)('should throw if name properties are not strings', () => {
      assert.throws(() => {
        updateContact({ firstName: 1 })
      }, /firstName must be a string/)

      assert.throws(() => {
        updateContact({ lastName: 1 })
      }, /lastName must be a string/)

      assert.throws(() => {
        updateContact({ nickname: 1 })
      }, /nickname must be a string/)
    })

    ifit(!isReadOnly)(
      'should throw if birthday is not a string in YYYY-MM-DD format',
      () => {
        assert.throws(() => {
          updateContact({ birthday: 1 })
        }, /birthday must be a string/)

        assert.throws(() => {
          updateContact({ birthday: '01-01-1970' })
        }, /birthday must use YYYY-MM-DD format/)
      },
    )

    ifit(!isReadOnly)('should throw if phoneNumbers is not an array', () => {
      assert.throws(() => {
        updateContact({ phoneNumbers: 1 })
      }, /phoneNumbers must be an array/)
    })

    ifit(!isReadOnly)('should throw if emailAddresses is not an array', () => {
      assert.throws(() => {
        updateContact({ emailAddresses: 1 })
      }, /emailAddresses must be an array/)
    })
  })

  ifdescribe(!isCI)('listener', () => {
    afterEach(() => {
      if (listener.isListening()) {
        listener.remove()
      }
    })

    it('throws when trying to remove a nonexistent listener', () => {
      assert.throws(() => {
        listener.remove()
      }, /No observers are currently observing/)
    })

    it('throws when trying to setup an already-existent listener', () => {
      assert.throws(() => {
        listener.setup()
        listener.setup()
      }, /An observer is already observing/)
    })

    ifit(!isReadOnly)('emits an event when the contact is changed', (done) => {
      listener.setup()

      addNewContact({
        firstName: 'William',
        lastName: 'Grapeseed',
        nickname: 'Billy',
        birthday: '1990-09-09',
        phoneNumbers: ['+1234567890'],
        emailAddresses: ['billy@grapeseed.com'],
      })

      listener.once('contact-changed', () => {
        done()
      })
    })
  })
})

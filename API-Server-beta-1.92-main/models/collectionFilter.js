export default class CollectionFilter {
    constructor(objects, params, model) {
        this.objects = objects;
        this.params = params;
        this.model = model;
    }

    // Filtrer les objets en fonction des paramètres de requête
    filtreParChamp() {
        return this.objects.filter(item => {
            for (const [key, value] of Object.entries(this.params)) {
                if (!this.model.isMember(key)) continue;

                if (!this.filtreValeur(item[key], value)) {
                    return false;
                }
            }
            return true;
        });
    }

    filtreValeur(itemValue, filterValue) {
        if (filterValue.startsWith('*') && filterValue.endsWith('*')) { // si commence et fini avec valeur
            return itemValue.includes(filterValue.slice(1, -1));
        } else if (filterValue.startsWith('*')) { // si commence 
            return itemValue.endsWith(filterValue.slice(1));
        } else if (filterValue.endsWith('*')) { // si fini 
            return itemValue.startsWith(filterValue.slice(0, -1));
        } else {
            return itemValue === filterValue;
        }
    }

    // Trier la collection
    sortParChamp() {
        if (!this.params.sort) {
            return this.objects;
        }
        const [fields, ordre] = this.params.sort.split(",");
        if (!this.model.isMember(fields)) { // verifie si le param fait partis du modele
            return this.objects;
        }
        return this.objects.sort((a, b) => {
            const comparaison = this.comparerValeur(a[fields], b[fields]); // compare les valeur
            return ordre === 'desc' ? comparaison * -1 : comparaison;
        });
    }


    comparerValeur(a, b) { // je me suis inspirer de compareNum pour faire cette fonction
        if (a === b) return 0;
        return a < b ? -1 : 1;
    }


    // Limiter et décaler la collection 
    limitAndOffset() {
        const { limit, offset } = this.params;
        if (!limit && !offset) {
            return this.objects;
        }
        const debut = offset ? parseInt(offset) : 0;  // la valeur de début en fonction du paramètre de décalage. Si non défini, la valeur de début est 0.
        let fin;
        if (limit) {
            fin = debut + parseInt(limit); //la valeur de fin en fonction du paramètre de limitation, en ajoutant la valeur de début. Si non défini, la valeur est undefined.
        }
        return this.objects.slice(debut, fin); // retourne les valeurs de début et fin slice
    }


    // Sélectionner les champs spécifiés dans les paramètres de requête
    fields() {
        if (!this.params.fields) {
            return this.objects;
        }
        const key = Object.values(this.params)[0];
        const setResult = new Set();
        const resultat = this.objects.map(obj => {
            const value = obj[key];
            if (!setResult.has(value)) { // ca me permet de ne pas retourner des doublons
                setResult.add(value);
                return { [key]: value };
            }
            return null;
        }).filter(item => item !== null);
        return resultat;
    }

    // Méthode principale qui appelle toutes les autres méthodes
    // cette fonction est appeller dans le getAll de repository.js
    get() {
        if (this.params === null) {
            return this.objects;
        }
        this.objects = this.filtreParChamp();
        this.objects = this.sortParChamp();
        this.objects = this.limitAndOffset();
        this.objects = this.fields();
        return this.objects;
    }
}
// http://localhost:5000/api/bookmarks?sort=Title,desc&Title=*e*&limit=5&offset=1